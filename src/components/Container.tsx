import { cn } from "@/lib/utils";

const Container = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props} className={cn("p-4 dark:prose-invert", props.className)}></div>;
};

export default Container;
