interface SoftmaniaLogoProps {
  size?: "sm" | "md" | "lg"
  variant?: "full" | "icon"
}

export function SoftmaniaLogo({ size = "md", variant = "full" }: SoftmaniaLogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  }

  if (variant === "icon") {
    return (
      <div className={`${sizeClasses[size]} flex items-center`}>
        <div className="relative">
          <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white dark:text-gray-900 font-bold text-lg">S</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} flex items-center gap-3`}>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-gray-900 dark:text-white font-heading"><span className="text-green-600">Soft</span> Mania</span>
      </div>
    </div>
  )
}