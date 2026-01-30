import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-[hsl(225_10%_15%)]", className)}
            {...props}
        />
    )
}

export { Skeleton }
