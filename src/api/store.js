import localforage from 'localforage'

const namespace = 'updated'

export const updateStore = (data = {}) => {
  return localforage
    .setItem(namespace, Date.now())
    .then(updated => ({ data, updated }))
}
