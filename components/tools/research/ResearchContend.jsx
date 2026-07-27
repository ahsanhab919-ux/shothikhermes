"use client";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  useGetResearchQuestionMutation,
  useResearchTrendingQuery,
} from "@/redux/api/tools/toolsApi";
import * as motion from "motion/react-client";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import FormComponent from "./form-component";
import RenderPart from "./RenderPart";
import Suggestion from "./Suggestion";
import { SuggestionCards } from "./SuggetionCard";
import UserMessage from "./UserMessage";

const ResearchContend = () => {
  const [selectedModel, setSelectedModel] = useState("shothik-brain-1.0");
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const { accessToken } = useSelector((state) => state.auth);
  const [getResearchQuestion] = useGetResearchQuestionMutation();
  const { data: trendingQueries } = useResearchTrendingQuery();
  const [selectedGroup, setSelectedGroup] = useState("web");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [outputContend, setOutputContend] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [userInput, setUserInput] = useState("");
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  async function fetchWithStreaming(content) {
    try {
      const payload = {
        messages: [{ role: "user", content }],
        model: selectedModel,
        group: selectedGroup,
      };

      const invocationMessage = {
        role: "assistant",
        type: "tool-invocation",
        content: "",
      };
      const userMessage = { role: "user", type: "message", content: content };

      setOutputContend((prev) => {
        return [...prev, userMessage, invocationMessage];
      });

      const url = process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX + "/research";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw { message: error.message, error: error.error };
      }

      const stream = response.body;
      const decoder = new TextDecoderStream();
      const reader = stream.pipeThrough(decoder).getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        if (value.startsWith("0:")) {
          setOutputContend((prev) => {
            return prev.map((item, index) => {
              const cleanedValue = value.replaceAll("0: ", "");
              if (index === prev.length - 1) {
                if (cleanedValue) {
                  // Ensure content is a string before concatenating
                  const currentContent =
                    typeof item.content === "string"
                      ? item.content
                      : typeof item.content === "object" &&
                          item.content !== null
                        ? item.content.text ||
                          item.content.content ||
                          item.content.result ||
                          item.content.answer ||
                          ""
                        : String(item.content || "");

                  return {
                    ...item,
                    content: currentContent + cleanedValue,
                  };
                } else {
                  return item;
                }
              }
              return item;
            });
          });
        } else if (value.startsWith("inovation:")) {
          try {
            const contentObj = JSON.parse(value.replace("inovation:", ""));
            const TextMessage = {
              role: "assistant",
              type: "text",
              content: "",
            };
            setOutputContend((prev) => {
              const updatedPrev = [...prev];
              updatedPrev[prev.length - 1] = {
                ...updatedPrev[prev.length - 1],
                content: contentObj,
                sources: contentObj.sources || [],
              };

              return [...updatedPrev, TextMessage];
            });
          } catch (error) {
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async function handleSubmit(content = userInput) {
    try {
      setIsLoading(true);
      await fetchWithStreaming(content);
      setIsLoading(false);
      setUserInput("");
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    const history = outputContend[outputContend.length - 1]?.content;
    if (!history) return;
    (async () => {
      try {
        const res = await getResearchQuestion({ history }).unwrap();
        setSuggestedQuestions(res.data);
      } catch (error) {
      }
    })();
  }, [isLoading]);

  const handleExampleClick = async (card) => {
    const exampleText = card.text;
    setHasSubmitted(true);
    setSuggestedQuestions([]);
    handleSubmit(exampleText);
  };

  const handleSuggestedQuestionClick = async (question) => {
    setSuggestedQuestions([]);
    handleSubmit(question);
  };

  const handleModelChange = (newModel) => {
    setSelectedModel(newModel);
    setSuggestedQuestions([]);
  };

  return (
    <div className={cn("h-[calc(100vh-70px)] overflow-auto")}>
      <div className={cn("mx-auto w-full pt-2 pb-2 md:w-4/5 lg:w-3/5")}>
        {!hasSubmitted ? (
          <div className="flex flex-col">
            <motion.p
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={cn(
                "mt-10 mb-2 text-center sm:mt-[60px] lg:mt-20",
                "text-2xl font-semibold tracking-tight",
              )}
            >
              What do you want to explore?
            </motion.p>
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <FormComponent
                input={userInput}
                setInput={setUserInput}
                attachments={attachments}
                setAttachments={setAttachments}
                hasSubmitted={hasSubmitted}
                setHasSubmitted={setHasSubmitted}
                isLoading={isLoading}
                handleSubmit={handleSubmit}
                fileInputRef={fileInputRef}
                inputRef={inputRef}
                selectedModel={selectedModel}
                setSelectedModel={handleModelChange}
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
              />
              <SuggestionCards
                trendingQueries={trendingQueries}
                handleExampleClick={handleExampleClick}
              />
            </motion.div>
          </div>
        ) : null}

        <div className={cn("mb-5 flex flex-col gap-1")}>
          {outputContend.map((message, index) =>
            message.role === "user" ? (
              <UserMessage key={index} message={message} />
            ) : message.role === "assistant" ? (
              <RenderPart
                key={index}
                group={selectedGroup}
                isLoading={isLoading}
                data={message}
                userQuestion={userInput}
              />
            ) : null,
          )}
          {suggestedQuestions.length ? (
            <Suggestion
              handleSuggestedQuestionClick={handleSuggestedQuestionClick}
              suggestedQuestions={suggestedQuestions}
            />
          ) : null}
        </div>

        <div className={cn("sticky bottom-0")}>
          {hasSubmitted && (
            <FormComponent
              input={userInput}
              setInput={setUserInput}
              attachments={attachments}
              setAttachments={setAttachments}
              hasSubmitted={hasSubmitted}
              setHasSubmitted={setHasSubmitted}
              isLoading={isLoading}
              handleSubmit={handleSubmit}
              fileInputRef={fileInputRef}
              inputRef={inputRef}
              selectedModel={selectedModel}
              setSelectedModel={handleModelChange}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
            />
          )}
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ResearchContend;
