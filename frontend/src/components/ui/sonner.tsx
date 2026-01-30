
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    // We'll stick to dark mode for now as per the app's design
    // but keeping the structure flexible
    return (
        <Sonner
            theme="dark"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-[hsl(225_10%_11%)] group-[.toaster]:text-[hsl(220_13%_91%)] group-[.toaster]:border-[hsl(225_8%_18%)] group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-[hsl(220_9%_63%)]",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
