import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DownloadCloud, FileText, User } from "lucide-react";
import { motion } from "motion/react";

const AcademicSearch = ({ data }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary/5 flex h-10 w-10 items-center justify-center rounded-lg">
            <FileText className="text-primary size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Academic Papers</h2>
            <p className="text-muted-foreground text-sm">{`Found ${data?.length} papers`}</p>
          </div>
        </div>
        <div className="mt-8 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-webkit-scrollbar]:hidden">
          {data?.map((paper, index) => (
            <motion.div
              key={paper.url || index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="w-[300px] shrink-0 border-none shadow-none transition-shadow hover:shadow-md">
                <CardContent className="p-3">
                  <div className="flex flex-col gap-2">
                    <h3 className="line-clamp-1 text-sm font-semibold">
                      {paper.title}
                    </h3>

                    {paper.author && (
                      <div>
                        <div className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs">
                          <User className="size-4" />
                          <span>
                            {paper.author.split(";").slice(0, 2).join(", ") +
                              (paper.author.split(";").length > 2
                                ? " et al."
                                : "")}
                          </span>
                        </div>
                      </div>
                    )}

                    {paper.publishedDate && (
                      <div>
                        <div className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs">
                          <Calendar className="size-4" />
                          <span>
                            {new Date(paper.publishedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-muted-foreground line-clamp-4 text-xs">
                        {paper.text}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(paper.url, "_blank")}
                        className="flex-1"
                      >
                        <FileText className="size-4" />
                        View Paper
                      </Button>

                      {paper.url.includes("arxiv.org") && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            window.open(
                              paper.url.replace("abs", "pdf"),
                              "_blank",
                            )
                          }
                          className="hover:bg-primary/10 bg-transparent"
                        >
                          <DownloadCloud className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AcademicSearch;
