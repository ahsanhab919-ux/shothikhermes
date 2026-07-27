"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Marked from "marked-react";

/**
 * BrowserWorkerMarkdown Component
 *
 * Renders markdown content for browser worker summaries
 * Uses marked-react with custom renderer for consistent styling
 */
export default function BrowserWorkerMarkdown({ content }) {
  const renderer = {
    paragraph(children) {
      return (
        <p
          key={this.elementId}
          className="text-foreground my-2 leading-relaxed"
        >
          {children}
        </p>
      );
    },

    heading(children, level) {
      const variantClasses = {
        1: "text-2xl font-semibold",
        2: "text-xl font-semibold",
        3: "text-lg font-medium",
        4: "text-base font-medium",
        5: "text-base",
        6: "text-sm",
      };
      const classes = cn(
        variantClasses[level] || "text-base",
        "my-3 text-foreground",
        level === 1 && "mt-4",
      );

      switch (level) {
        case 1:
          return (
            <h1 key={this.elementId} className={classes}>
              {children}
            </h1>
          );
        case 2:
          return (
            <h2 key={this.elementId} className={classes}>
              {children}
            </h2>
          );
        case 3:
          return (
            <h3 key={this.elementId} className={classes}>
              {children}
            </h3>
          );
        case 4:
          return (
            <h4 key={this.elementId} className={classes}>
              {children}
            </h4>
          );
        case 5:
          return (
            <h5 key={this.elementId} className={classes}>
              {children}
            </h5>
          );
        case 6:
          return (
            <h6 key={this.elementId} className={classes}>
              {children}
            </h6>
          );
        default:
          return (
            <p key={this.elementId} className={classes}>
              {children}
            </p>
          );
      }
    },

    strong(children) {
      return (
        <strong key={this.elementId} className="text-foreground font-semibold">
          {children}
        </strong>
      );
    },

    em(children) {
      return (
        <em key={this.elementId} className="text-foreground italic">
          {children}
        </em>
      );
    },

    list(children, ordered) {
      const ListTag = ordered ? "ol" : "ul";
      const listClass = ordered
        ? "my-2 list-decimal list-inside space-y-1"
        : "my-2 list-disc list-inside space-y-1";

      return (
        <ListTag
          key={this.elementId}
          className={cn(listClass, "text-foreground")}
        >
          {children}
        </ListTag>
      );
    },

    listItem(children) {
      return (
        <li key={this.elementId} className="text-foreground/90 ml-2">
          {children}
        </li>
      );
    },

    link(children, href) {
      return (
        <a
          key={this.elementId}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {children}
        </a>
      );
    },

    code(children) {
      return (
        <code
          key={this.elementId}
          className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-sm"
        >
          {children}
        </code>
      );
    },

    codeBlock(children, language) {
      return (
        <pre
          key={this.elementId}
          className={cn(
            "bg-muted text-foreground my-3 overflow-x-auto rounded p-3 text-sm",
            "font-mono leading-relaxed",
          )}
        >
          <code>{children}</code>
        </pre>
      );
    },

    blockquote(children) {
      return (
        <blockquote
          key={this.elementId}
          className="border-border bg-muted/30 text-foreground/80 my-3 border-l-4 pl-4 italic"
        >
          {children}
        </blockquote>
      );
    },

    hr() {
      return (
        <hr key={this.elementId} className="border-border my-4 border-t" />
      );
    },

    table(children) {
      return (
        <div key={this.elementId} className="my-3 overflow-x-auto">
          <Table>{children}</Table>
        </div>
      );
    },

    tableHead(children) {
      return <TableHeader key={this.elementId}>{children}</TableHeader>;
    },

    tableBody(children) {
      return <TableBody key={this.elementId}>{children}</TableBody>;
    },

    tableRow(children) {
      return <TableRow key={this.elementId}>{children}</TableRow>;
    },

    tableCell(children, { header }) {
      return header ? (
        <TableHead key={this.elementId}>
          <strong>{children}</strong>
        </TableHead>
      ) : (
        <TableCell key={this.elementId}>{children}</TableCell>
      );
    },
  };

  return <Marked renderer={renderer}>{content}</Marked>;
}
