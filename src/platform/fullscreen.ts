export async function setFullScreen(fullscreen: boolean): Promise<void> {
  if (fullscreen) {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
  } else if (document.fullscreenElement) {
    await document.exitFullscreen()
  }
}

export function isFullScreen(): boolean {
  return document.fullscreenElement !== null
}

export function onFullScreenChange(callback: (fullscreen: boolean) => void): () => void {
  const listener = (): void => callback(document.fullscreenElement !== null)
  document.addEventListener('fullscreenchange', listener)
  return () => document.removeEventListener('fullscreenchange', listener)
}
