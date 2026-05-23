import { contextBridge, ipcRenderer } from 'electron'
import type { Listing } from '../../src/types/listing'

contextBridge.exposeInMainWorld('electron', {
  searchReddit: (query: string): Promise<Listing[]> =>
    ipcRenderer.invoke('search:reddit', query),

  searchCraigslist: (query: string): Promise<Listing[] | { error: string }> =>
    ipcRenderer.invoke('search:craigslist', query),

  openFacebook: (query: string): Promise<void> =>
    ipcRenderer.invoke('facebook:open', query),

  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('shell:openExternal', url),
})
