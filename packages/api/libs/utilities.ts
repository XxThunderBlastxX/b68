import { PaginationType } from '../types'

export const makeResponse = (
    data: any,
    meta_data: any = null,
    message = 'Success',
    error = false
) => ({
    message,
    error,
    meta_data,
    data,
})

const joinPrefix = (...keys: string[]) => keys.join('_')

export const flattenObject = (obj: any, prefix = '') => {
    let newObj: any = {}
    for (const key in obj) {
        const pfx = prefix ? joinPrefix(prefix, key) : key
        if (obj[key] instanceof Object) {
            newObj = { ...newObj, ...flattenObject(obj[key], pfx) }
        } else {
            newObj = { ...newObj, [pfx]: obj[key] }
        }
    }
    return newObj
}

export const cleanObject = (obj: any) => {
    const newObj: any = obj
    for (const k in obj) {
        if (
            (!k || !obj[k] || typeof k === 'undefined') &&
            typeof obj[k] !== 'boolean' &&
            obj[k] !== 0
        )
            delete obj[k]
    }
    return newObj
}

//helpful for update apis, such that an existing field can be updated to null
export const cleanObjectKeepNull = (obj: any) => {
    const newObj: any = obj
    for (const k in obj) {
        if (
            (!k || !obj[k] || typeof k === 'undefined') &&
            typeof obj[k] !== 'boolean' &&
            obj[k] !== 0 &&
            obj[k] !== null
        )
            delete obj[k]
    }
    return newObj
}

export const paginateRequest = (q: any): PaginationType => {
    const filter_keys = Object.keys(q).filter((c) => c.startsWith('filter_'))
    const filters = filter_keys.length
        ? filter_keys
              .map((filter_key) => {
                  const filter_subset = filter_key
                      .replace('filter_', '')
                      .split('.')
                  let mode =
                      typeof q[filter_key] === 'number' ? '_eq' : '_iregex'
                  // check if the provided value if uuid - if so, we use the _eq operator to match
                  if (q[filter_key].includes('-')) {
                      mode = '_eq'
                  }

                  return parseFilter(filter_subset, q[filter_key], 0, mode)
              })
              .reduceRight((agg, cur) => {
                  const [cur_key] = Object.keys(cur)
                  if (cur_key in agg) {
                      if (Array.isArray(agg[cur_key])) {
                          agg[cur_key].push(cur)
                      } else {
                          cur[cur_key] = [cur[cur_key], agg[cur_key]]
                      }
                      return cur
                  }
                  return {
                      ...agg,
                      ...cur,
                  }
              }, {})
        : undefined
    return {
        page: parseInt(q.page) || 0,
        limit: parseInt(q.limit || q.items) || 50,
        sort_by: q.sort_by,
        sort_order: q.sort_order || 'asc',
        filters,
    } as PaginationType
}

// parse the filter from the query string into the filter object with graphql where object format
export const parseFilter = (
    filter: string[],
    value: string,
    index = 0,
    filterMode = '_iregex'
) => {
    let fx: any = { [filterMode]: value }
    if (index < filter.length - 1) {
        fx = parseFilter(filter, value, index + 1, filterMode)
    }

    const key = filter[index]
    return { [key]: fx }
}

//returns input timestamp - input hours in datestring
export const subtractHours = (date: Date, hours: number) => {
    date.setHours(date.getHours() - hours)
    return date.toISOString()
}

export const capitalizeEachWord = (str: string) => {
    return str
        .split(' ')
        .map((word) =>
            !word.length
                ? ''
                : word[0].toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ')
}

//filters requested key-values from an object
export const pick = (object: any, keys: any) => {
    return keys.reduce((obj: any, key: any) => {
        // removed hasOwnProperty check because of typescript compiler error
        if (object && key in object) {
            obj[key] = object[key]
        }
        return obj
    }, {})
}

/**
 * Get the sort column from the parsed query params and validate them based on a provided list of options
 * @param  pg_sort_by Query parameter from which the sort column needs to be located.
 * @param  def Default value if the parse fails
 * @param  options List of valid columns that can be used as filters
 */
export const getSortColumn = (
    pg_sort_by?: string,
    def = 'id',
    options: string[] = []
) => {
    pg_sort_by ||= def
    return options.includes(pg_sort_by) ? pg_sort_by : def
}

/**
 * Check whether a string matches the uuid format for postgres or not.
 */
export const is_uuid = (value: string) => {
    // storing as a separate regex object for future modifications and code readibility
    const regex = /^()/
    return regex.test(value)
}
