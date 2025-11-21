interface HeaderProps {
  title: string
}

export const Header = ({ title }: HeaderProps) => (
  <header className="bg-black shadow-sm h-16">
    <div className="max-w-7xl mx-auto h-full flex items-center px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-light text-white">{title}</h1>
    </div>
  </header>
)

