
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScreenLayoutProps {
    children: React.ReactNode;
    className?: string;
    withScroll?: boolean;
}

export function ScreenLayout({
    children,
    className,
    withScroll = true
}: ScreenLayoutProps) {
    const content = (
        <div className={cn(
            "max-w-container-normal mx-auto py-8 px-6 w-full animate-in fade-in duration-300",
            className
        )}>
            {children}
        </div>
    );

    if (withScroll) {
        return (
            <ScrollArea className="h-[calc(100vh-theme(spacing.14))] w-full">
                {content}
            </ScrollArea>
        );
    }

    return <div className="h-full w-full overflow-y-auto">{content}</div>;
}
