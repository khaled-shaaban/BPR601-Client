/**
 * Loads and caches reference data (cities, areas, authorities) used by forms.
 */
export function useReferenceData() {
  const cities = useState<any[]>('ref_cities', () => [])
  const areas = useState<any[]>('ref_areas', () => [])
  const authorities = useState<any[]>('ref_authorities', () => [])
  const loaded = useState<boolean>('ref_loaded', () => false)

  async function load() {
    if (loaded.value) return
    const api = useApi()
    const [c, a, au] = await Promise.all([
      api<{ data: any[] }>('/cities', { params: { per_page: 100 } }),
      api<{ data: any[] }>('/areas', { params: { per_page: 100 } }),
      api<{ data: any[] }>('/authorities', { params: { per_page: 100 } }),
    ])
    cities.value = c.data
    areas.value = a.data
    authorities.value = au.data
    loaded.value = true
  }

  const cityName = (id: number) => cities.value.find((c) => c.id === id)?.name ?? ''
  const areaName = (id: number) => areas.value.find((a) => a.id === id)?.name ?? ''
  const authorityName = (id: number) => authorities.value.find((a) => a.id === id)?.name ?? ''

  // "governorate - region" for a given authority (identifies same-named authorities).
  function authoritySuffix(id: number) {
    const auth = authorities.value.find((a) => a.id === id)
    if (!auth) return ''
    const region = areas.value.find((a) => a.id === auth.area_id)
    const city = region ? cities.value.find((c) => c.id === region.city_id) : null
    return [city?.name, region?.name].filter(Boolean).join(' - ')
  }
  // Full display label: "name (governorate - region)".
  function authorityLabel(id: number) {
    const auth = authorities.value.find((a) => a.id === id)
    if (!auth) return ''
    const suffix = authoritySuffix(id)
    return suffix ? `${auth.name} (${suffix})` : auth.name
  }

  return {
    cities,
    areas,
    authorities,
    loaded,
    load,
    cityName,
    areaName,
    authorityName,
    authoritySuffix,
    authorityLabel,
  }
}
