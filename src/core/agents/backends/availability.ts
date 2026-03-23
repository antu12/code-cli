export function getAvailabilityCommand(binary: string, platform = process.platform): { file: string; args: string[] } {
  if (platform === 'win32') {
    return { file: 'where.exe', args: [binary] };
  }

  return { file: 'which', args: [binary] };
}
