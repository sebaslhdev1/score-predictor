export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className='relative min-h-screen overflow-hidden flex justify-center p-4 pt-8'
      style={{ background: `linear-gradient(135deg, #2b2b2d 0%, var(--brand-dark) 50%, #2b2b2d 100%)` }}
    >
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div
          className='absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full blur-3xl'
          style={{ backgroundColor: 'color-mix(in srgb, var(--brand-orange) 8%, transparent)' }}
        />
        <div
          className='absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full blur-3xl'
          style={{ backgroundColor: 'color-mix(in srgb, var(--brand-green) 8%, transparent)' }}
        />
        <div
          className='absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl'
          style={{ backgroundColor: 'color-mix(in srgb, var(--brand-orange) 5%, transparent)' }}
        />
      </div>
      <div className='relative z-10 w-full'>{children}</div>
    </div>
  )
}
