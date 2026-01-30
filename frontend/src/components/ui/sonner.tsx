
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
                        "group toast group-[.toaster]:bg-zinc-900 group-[.toaster]:text-zinc-100 group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-zinc-400",
                    actionButton:
                        "group-[.toast]:bg-indigo-600 group-[.toast]:text-zinc-100",
                    cancelButton:
                        "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-400",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
