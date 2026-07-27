import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

// ----------------------------------------------------------------------

const getCharAtName = (name) => name && name.charAt(0).toUpperCase();

const getColorByName = (name) => {
  const char = getCharAtName(name);
  if (["A", "N", "H", "L", "Q"].includes(char))
    return "bg-primary text-primary-foreground";
  if (["F", "G", "T", "I", "J"].includes(char)) return "bg-blue-500 text-white";
  if (["K", "D", "Y", "B", "O"].includes(char))
    return "bg-green-500 text-white";
  if (["P", "E", "R", "S", "U"].includes(char))
    return "bg-yellow-500 text-white";
  if (["V", "W", "X", "M", "Z"].includes(char)) return "bg-red-500 text-white";
  return "bg-muted text-muted-foreground";
};

// ----------------------------------------------------------------------

const CustomAvatar = forwardRef(
  (
    { src, alt, color, name = "", BadgeProps, children, className, ...other },
    ref,
  ) => {
    const charAtName = getCharAtName(name);
    const colorByName = getColorByName(name);
    const colr = color || colorByName;

    const renderContent =
      colr === "default" ? (
        <Avatar ref={ref} className={cn("bg-muted", className)} {...other}>
          {src && <AvatarImage src={src} alt={alt} />}
          {name && <AvatarFallback>{charAtName}</AvatarFallback>}
          {children}
        </Avatar>
      ) : (
        <Avatar ref={ref} className={cn("font-medium", className)} {...other}>
          {src && <AvatarImage src={src} alt={alt} />}
          {name && (
            <AvatarFallback className={cn(colr)}>{charAtName}</AvatarFallback>
          )}
          {children}
        </Avatar>
      );

    return BadgeProps ? (
      <Badge {...BadgeProps}>{renderContent}</Badge>
    ) : (
      renderContent
    );
  },
);

CustomAvatar.displayName = "CustomAvatar";

export default CustomAvatar;
