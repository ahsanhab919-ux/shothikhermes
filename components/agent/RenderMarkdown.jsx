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
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import Marked from "marked-react";
import { Bar, Pie } from "react-chartjs-2";
import SlidePreview from "./SlidePreview";

ChartJS.register(
  LineElement,
  PointElement,
  ArcElement,
  LinearScale,
  CategoryScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
);

const RenderMarkdown = ({ content }) => {
  const renderer = {
    paragraph(children) {
      return (
        <p key={this.elementId} className="text-foreground my-1">
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
        "my-2 text-foreground",
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

    list(children, ordered) {
      const classes = cn(
        "pl-4 text-foreground my-2",
        ordered ? "list-decimal" : "list-disc",
        "[&_li]:list-item",
      );

      if (ordered) {
        return (
          <ol key={this.elementId} className={classes}>
            {children}
          </ol>
        );
      } else {
        return (
          <ul key={this.elementId} className={classes}>
            {children}
          </ul>
        );
      }
    },

    listItem(children) {
      return (
        <li key={this.elementId} className="text-foreground list-item p-0">
          {children}
        </li>
      );
    },

    code(children) {
      let data = undefined;
      try {
        data = JSON.parse(children);
      } catch {
      }
      if (!data) return null;
      if (data.type) {
        return (
          <div
            key={this.elementId}
            className="my-2 flex items-center justify-center"
          >
            {data.type === "bar" ? (
              <div style={{ height: "200px", width: "400px" }}>
                <Bar data={data.data} />
              </div>
            ) : data.type === "pie" ? (
              <div style={{ height: "300px", width: "300px" }}>
                <Pie data={data.data} />
              </div>
            ) : null}
          </div>
        );
      } else {
        return data?.map((item, index) => (
          <div key={index} className="my-2 h-[250px] overflow-hidden">
            <SlidePreview src={item} />
          </div>
        ));
      }
    },

    table(children) {
      return (
        <div key={this.elementId} className="my-2">
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
};

export default RenderMarkdown;
