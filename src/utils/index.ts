interface SendResponseOptions<T = any> {
  type: 'Success' | 'Fail'
  message?: string
  data?: T
}

export function sendResponse<T>(options: SendResponseOptions<T>) {
  if (options.type === 'Success') {
    return Promise.resolve({
      message: options.message ?? null,
      data: options.data ?? null,
      status: options.type,
    })
  }

  // eslint-disable-next-line prefer-promise-reject-errors
  return Promise.reject({
    message: options.message ?? 'Failed',
    data: options.data ?? null,
    status: options.type,
  })
}

export function stringToHex(str: string) {
  // if (typeof str !== 'string')
  //   str = JSON.stringify(str)

  const arr = []
  for (let i = 0; i < str.length; i++) arr[i] = `00${str.charCodeAt(i).toString(16)}`.slice(-4)

  return `\\u${arr.join('\\u')}`
}
