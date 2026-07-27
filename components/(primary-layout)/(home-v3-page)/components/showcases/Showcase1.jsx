import { useState, useEffect, useRef } from "react";

// Simple icon components
const X = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const Circle = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10"></circle>
  </svg>
);

const CheckCircle = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const Loader2 = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="animate-spin"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
  </svg>
);

const FileText = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const ChevronUp = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

const Trash = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const CursorAgentUI = () => {
  const [position, setPosition] = useState({ x: 500, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef(null);

  const [tasks, setTasks] = useState({
    inProgress: [
      {
        id: 1,
        title: "Enterprise Order Management",
        subtitle: "Generating",
        progress: 45,
      },
      {
        id: 2,
        title: "PyTorch MNIST Experiments",
        subtitle: "Generating",
        progress: 78,
      },
      {
        id: 3,
        title: "Fix PR Comments Fetching Issue",
        subtitle: "Generating",
        progress: 23,
      },
    ],
    ready: [
      {
        id: 4,
        title: "Analyze Tab vs Agent Usage",
        time: "Just Now",
        description:
          "All set! We now track focus share, switching rates, and rolling engagement so PMs can compare tab-first and agent-first workflows in seconds.",
        tag: "+94-0",
        completed: false,
        files: [
          { name: "segmentation.py", additions: 94, deletions: 0 },
          { name: "report.py", additions: 40, deletions: 0 },
          { name: "test_usage.py", additions: 90, deletions: 0 },
        ],
      },
      {
        id: 5,
        title: "Set up Shothik AI Rules for Project",
        time: "30m",
        tag: "+37-0",
        description:
          "Created .cursorrules file with project-specific guidelines for better AI assistance.",
        completed: false,
        files: [{ name: ".cursorrules", additions: 37, deletions: 0 }],
      },
      {
        id: 6,
        title: "Bioinformatics Tools",
        time: "45m",
        tag: "+133-21",
        description:
          "Implemented sequence alignment algorithms and added visualization components.",
        completed: false,
        files: [
          { name: "alignment.py", additions: 78, deletions: 12 },
          { name: "visualization.py", additions: 55, deletions: 9 },
        ],
      },
    ],
  });

  const [selectedTask, setSelectedTask] = useState(tasks.ready[0]);
  const [showModal, setShowModal] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.closest(".no-drag")) return;
    if (!e.target.closest(".drag-handle")) return;

    e.preventDefault();
    setIsDragging(true);

    const rect = windowRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, dragStart]);

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) => ({
        ...prev,
        inProgress: prev.inProgress.map((task) => {
          const newProgress = Math.min(100, task.progress + Math.random() * 5);

          // Move to ready when complete
          if (newProgress >= 100 && task.progress < 100) {
            setTimeout(() => {
              setTasks((current) => {
                const completedTask = current.inProgress.find(
                  (t) => t.id === task.id,
                );
                if (!completedTask) return current;

                return {
                  inProgress: current.inProgress.filter(
                    (t) => t.id !== task.id,
                  ),
                  ready: [
                    {
                      id: completedTask.id,
                      title: completedTask.title,
                      time: "Just Now",
                      description: `${completedTask.title} completed successfully`,
                      tag: "+100-0",
                      completed: false,
                      files: [
                        { name: "output.py", additions: 100, deletions: 0 },
                      ],
                    },
                    ...current.ready,
                  ],
                };
              });
            }, 500);
          }

          return { ...task, progress: newProgress };
        }),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Toggle task completion
  const toggleTaskComplete = (taskId) => {
    setTasks((prev) => ({
      ...prev,
      ready: prev.ready.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    }));
  };

  // Delete task
  const deleteTask = (taskId, e) => {
    e.stopPropagation();
    setTasks((prev) => ({
      ...prev,
      ready: prev.ready.filter((task) => task.id !== taskId),
      inProgress: prev.inProgress.filter((task) => task.id !== taskId),
    }));

    if (selectedTask?.id === taskId) {
      setSelectedTask(
        tasks.ready.find((t) => t.id !== taskId) || tasks.inProgress[0] || null,
      );
    }
  };

  // Add new task
  const addNewTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      subtitle: "Generating",
      progress: 0,
    };

    setTasks((prev) => ({
      ...prev,
      inProgress: [...prev.inProgress, newTask],
    }));

    setNewTaskTitle("");
  };

  if (!showModal) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-orange-500 px-6 py-3 text-white shadow-lg transition-all hover:bg-orange-600"
        >
          Open Agent Window
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-500"></div>
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-orange-500"></div>
      </div>

      {/* Main modal window */}
      <div
        ref={windowRef}
        className="absolute z-10 flex overflow-hidden rounded-xl bg-white shadow-2xl"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: "1000px",
          maxWidth: "calc(100vw - 40px)",
        }}
      >
        {/* Left sidebar - Task list */}
        <div className="w-80 border-r border-gray-200 bg-gray-50">
          {/* Header - Draggable */}
          <div
            className="drag-handle cursor-grab border-b border-gray-200 bg-white px-4 py-3 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500"></div>
                <div className="flex h-3 w-3 items-center justify-center rounded-full bg-yellow-500"></div>
                <div className="flex h-3 w-3 items-center justify-center rounded-full bg-green-500"></div>
              </div>
              <span className="text-sm text-gray-600">Shothik AI</span>
              <button className="no-drag text-sm text-gray-600 hover:text-gray-800">
                Get shothik
              </button>
            </div>
          </div>

          {/* Task sections */}
          <div className="h-[600px] overflow-y-auto p-4">
            {/* In Progress */}
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  In Progress {tasks.inProgress.length}
                </h3>
              </div>
              <div className="space-y-2">
                {tasks.inProgress.map((task) => (
                  <div
                    key={task.id}
                    className="group cursor-pointer rounded-lg bg-white p-3 shadow-sm transition-all hover:shadow-md"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        <Loader2 />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {task.subtitle}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteTask(task.id, e)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash />
                      </button>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200">
                      <div
                        className="h-1.5 rounded-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {Math.round(task.progress)}% complete
                    </p>
                  </div>
                ))}
              </div>

              {/* Add new task form */}
              <form onSubmit={addNewTask} className="mt-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add new task..."
                  className="focus:ring-opacity-20 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                />
              </form>
            </div>

            {/* Ready for Review */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Ready for Review {tasks.ready.length}
                </h3>
              </div>
              <div className="space-y-2">
                {tasks.ready.map((task) => (
                  <div
                    key={task.id}
                    className={`group cursor-pointer rounded-lg bg-white p-3 shadow-sm transition-all hover:shadow-md ${
                      selectedTask?.id === task.id
                        ? "ring-2 ring-orange-500"
                        : ""
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskComplete(task.id);
                          }}
                        >
                          {task.completed ? <CheckCircle /> : <Circle />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-sm font-medium text-gray-900 ${task.completed ? "line-through" : ""}`}
                            >
                              {task.title}
                            </p>
                            <span className="text-xs text-gray-500">
                              {task.time}
                            </span>
                          </div>
                          {task.tag && (
                            <span className="mt-2 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              {task.tag}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteTask(task.id, e)}
                        className="ml-2 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Task detail view */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div
            className="drag-handle flex cursor-grab items-center justify-between border-b border-gray-200 bg-white px-6 py-4 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedTask?.title || "Select a task"}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="no-drag rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X />
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {selectedTask && (
              <div className="space-y-4">
                {/* For in-progress tasks, show live code generation */}
                {selectedTask.progress !== undefined &&
                selectedTask.progress < 100 ? (
                  <div className="space-y-4">
                    {/* Current action */}
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center space-x-2">
                        <Loader2 />
                        <span className="text-sm font-semibold text-gray-900">
                          {selectedTask.progress < 30
                            ? "Analyzing requirements..."
                            : selectedTask.progress < 60
                              ? "Writing code..."
                              : "Finalizing and testing..."}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-orange-500 transition-all duration-500"
                          style={{ width: `${selectedTask.progress}%` }}
                        ></div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {Math.round(selectedTask.progress)}% complete
                      </p>
                    </div>

                    {/* Code editor simulation with tabs */}
                    <div className="rounded-lg bg-white shadow-sm">
                      {/* Editor tabs */}
                      <div className="flex items-center border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center space-x-1 px-2 py-2">
                          <div className="flex items-center space-x-2 rounded-t bg-white px-3 py-1.5 shadow-sm">
                            <span className="text-xs font-medium text-gray-700">
                              {selectedTask.progress < 40
                                ? "requirements.txt"
                                : selectedTask.progress < 70
                                  ? "Dashboard.tsx"
                                  : "SupportChat.tsx"}
                            </span>
                            <button className="text-gray-400 hover:text-gray-600">
                              <X />
                            </button>
                          </div>
                          <div className="flex items-center space-x-2 px-3 py-1.5 text-gray-500">
                            <span className="text-xs">
                              {selectedTask.progress < 40
                                ? "package.json"
                                : selectedTask.progress < 70
                                  ? "SupportChat.tsx"
                                  : "Navigation.tsx"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-auto flex items-center space-x-4 px-4">
                          <span className="text-xs text-gray-500">
                            Shothik AI
                          </span>
                          <span className="text-xs text-gray-400">
                            Get Shothik
                          </span>
                        </div>
                      </div>

                      {/* Code content */}
                      <div className="relative bg-white p-6 font-mono text-sm">
                        {selectedTask.progress < 40 && (
                          <div className="space-y-1">
                            <div className="text-pink-600">"use client";</div>
                            <div className="mt-3">
                              <span className="text-purple-600">import</span>
                              <span className="text-gray-800"> React, </span>
                              <span className="text-gray-800">
                                {"{ useState }"}
                              </span>
                              <span className="text-purple-600"> from </span>
                              <span className="text-pink-600">"react"</span>
                              <span className="text-gray-800">;</span>
                            </div>
                            <div>
                              <span className="text-purple-600">import</span>
                              <span className="text-gray-800">
                                {" "}
                                Navigation{" "}
                              </span>
                              <span className="text-purple-600">from </span>
                              <span className="text-pink-600">
                                "./Navigation"
                              </span>
                              <span className="flex items-center">
                                <span className="text-gray-800">;</span>
                                <div className="ml-1 h-5 w-0.5 animate-pulse bg-gray-900"></div>
                              </span>
                            </div>
                          </div>
                        )}

                        {selectedTask.progress >= 40 &&
                          selectedTask.progress < 70 && (
                            <div className="space-y-1">
                              <div className="text-pink-600">"use client";</div>
                              <div className="mt-3">
                                <span className="text-purple-600">import</span>
                                <span className="text-gray-800"> React, </span>
                                <span className="text-gray-800">
                                  {"{ useState }"}
                                </span>
                                <span className="text-purple-600"> from </span>
                                <span className="text-pink-600">"react"</span>
                                <span className="text-gray-800">;</span>
                              </div>
                              <div>
                                <span className="text-purple-600">import</span>
                                <span className="text-gray-800">
                                  {" "}
                                  Navigation{" "}
                                </span>
                                <span className="text-purple-600">from </span>
                                <span className="text-pink-600">
                                  "./Navigation"
                                </span>
                                <span className="text-gray-800">;</span>
                              </div>
                              <div>
                                <span className="text-purple-600">import</span>
                                <span className="text-gray-800">
                                  {" "}
                                  SupportChat{" "}
                                </span>
                                <span className="text-purple-600">from </span>
                                <span className="text-pink-600">
                                  "./SupportChat"
                                </span>
                                <span className="text-gray-800">;</span>
                              </div>
                              <div className="mt-3">
                                <span className="text-purple-600">
                                  export default function{" "}
                                </span>
                                <span className="text-orange-600">
                                  Dashboard
                                </span>
                                <span className="text-gray-800">{"() {"}</span>
                              </div>
                              <div className="ml-4">
                                <span className="text-purple-600">const </span>
                                <span className="text-gray-800">
                                  [activeTab, setActiveTab] ={" "}
                                </span>
                                <span className="text-blue-600">useState</span>
                                <span className="text-gray-800">(</span>
                                <span className="text-pink-600">"support"</span>
                                <span className="text-gray-800">);</span>
                              </div>
                              <div className="mt-2 ml-4">
                                <span className="text-purple-600">return </span>
                                <span className="text-gray-800">(</span>
                              </div>
                              <div className="ml-8">
                                <span className="text-gray-600">{"<"}</span>
                                <span className="text-blue-600">div </span>
                                <span className="text-orange-600">
                                  className
                                </span>
                                <span className="text-gray-600">=</span>
                                <span className="text-pink-600">
                                  "flex h-[600px] border rounded-lg
                                  overflow-hidden"
                                </span>
                                <span className="text-gray-600">{">"}</span>
                              </div>
                              <div className="ml-12">
                                <span className="text-gray-600">{"<"}</span>
                                <span className="text-blue-600">div </span>
                                <span className="text-orange-600">
                                  className
                                </span>
                                <span className="text-gray-600">=</span>
                                <span className="text-pink-600">
                                  "w-64 border-r"
                                </span>
                                <span className="text-gray-600">{">"}</span>
                              </div>
                              <div className="ml-16">
                                <span className="text-gray-600">{"<"}</span>
                                <span className="text-green-600">
                                  Navigation{" "}
                                </span>
                                <span className="text-orange-600">
                                  activeTab
                                </span>
                                <span className="text-gray-600">=</span>
                                <span className="text-gray-800">
                                  {"{activeTab}"}
                                </span>
                                <span className="flex items-center">
                                  <span className="text-gray-600">
                                    {" "}
                                    onSelectTab
                                  </span>
                                  <div className="ml-1 h-5 w-0.5 animate-pulse bg-gray-900"></div>
                                </span>
                              </div>
                            </div>
                          )}

                        {selectedTask.progress >= 70 && (
                          <div className="space-y-1">
                            <div className="text-pink-600">"use client";</div>
                            <div className="mt-3">
                              <span className="text-purple-600">import</span>
                              <span className="text-gray-800"> React, </span>
                              <span className="text-gray-800">
                                {"{ useState }"}
                              </span>
                              <span className="text-purple-600"> from </span>
                              <span className="text-pink-600">"react"</span>
                              <span className="text-gray-800">;</span>
                            </div>
                            <div>
                              <span className="text-purple-600">import</span>
                              <span className="text-gray-800">
                                {" "}
                                Navigation{" "}
                              </span>
                              <span className="text-purple-600">from </span>
                              <span className="text-pink-600">
                                "./Navigation"
                              </span>
                              <span className="text-gray-800">;</span>
                            </div>
                            <div>
                              <span className="text-purple-600">import</span>
                              <span className="text-gray-800">
                                {" "}
                                SupportChat{" "}
                              </span>
                              <span className="text-purple-600">from </span>
                              <span className="text-pink-600">
                                "./SupportChat"
                              </span>
                              <span className="text-gray-800">;</span>
                            </div>
                            <div className="mt-3">
                              <span className="text-purple-600">
                                export default function{" "}
                              </span>
                              <span className="text-orange-600">Dashboard</span>
                              <span className="text-gray-800">{"() {"}</span>
                            </div>
                            <div className="ml-4">
                              <span className="text-purple-600">const </span>
                              <span className="text-gray-800">
                                [activeTab, setActiveTab] ={" "}
                              </span>
                              <span className="text-blue-600">useState</span>
                              <span className="text-gray-800">(</span>
                              <span className="text-pink-600">"support"</span>
                              <span className="text-gray-800">);</span>
                            </div>
                            <div className="mt-2 ml-4">
                              <span className="text-purple-600">return </span>
                              <span className="text-gray-800">(</span>
                            </div>
                            <div className="ml-8">
                              <span className="text-gray-600">{"<"}</span>
                              <span className="text-blue-600">div </span>
                              <span className="text-orange-600">className</span>
                              <span className="text-gray-600">=</span>
                              <span className="text-pink-600">
                                "flex h-[600px] border rounded-lg
                                overflow-hidden"
                              </span>
                              <span className="text-gray-600">{">"}</span>
                            </div>
                            <div className="ml-12">
                              <span className="text-gray-600">{"<"}</span>
                              <span className="text-blue-600">div </span>
                              <span className="text-orange-600">className</span>
                              <span className="text-gray-600">=</span>
                              <span className="text-pink-600">
                                "w-64 border-r"
                              </span>
                              <span className="text-gray-600">{">"}</span>
                            </div>
                            <div className="ml-16">
                              <span className="text-gray-600">{"<"}</span>
                              <span className="text-green-600">
                                Navigation{" "}
                              </span>
                              <span className="text-orange-600">activeTab</span>
                              <span className="text-gray-600">=</span>
                              <span className="text-gray-800">
                                {"{activeTab}"}
                              </span>
                              <span className="text-gray-600">
                                {" "}
                                onSelectTab
                              </span>
                              <span className="text-gray-600">=</span>
                              <span className="text-gray-800">
                                {"{setActiveTab}"}
                              </span>
                              <span className="text-gray-600"> /{">"}</span>
                            </div>
                            <div className="ml-12">
                              <span className="text-gray-600">{"</"}</span>
                              <span className="text-blue-600">div</span>
                              <span className="text-gray-600">{">"}</span>
                            </div>
                            <div className="ml-12">
                              <span className="text-gray-600">{"<"}</span>
                              <span className="text-blue-600">div </span>
                              <span className="text-orange-600">className</span>
                              <span className="text-gray-600">=</span>
                              <span className="text-pink-600">
                                "w-80 border-l"
                              </span>
                              <span className="text-gray-600">{">"}</span>
                            </div>
                            <div className="ml-16 flex items-center">
                              <span className="text-gray-600">{"<"}</span>
                              <span className="text-green-600">
                                SupportChat{" "}
                              </span>
                              <span className="text-gray-600">/{">"}</span>
                              <div className="ml-1 h-5 w-0.5 animate-pulse bg-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Activity log */}
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <h4 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                        Activity Log
                      </h4>
                      <div className="space-y-2 font-mono text-xs">
                        <div className="text-green-600">
                          ✓ Project structure analyzed
                        </div>
                        <div className="text-green-600">
                          ✓ Dependencies identified
                        </div>
                        {selectedTask.progress >= 30 && (
                          <div className="text-green-600">
                            ✓ API routes defined
                          </div>
                        )}
                        {selectedTask.progress >= 50 && (
                          <div className="text-green-600">
                            ✓ Database models created
                          </div>
                        )}
                        {selectedTask.progress >= 70 && (
                          <div className="text-green-600">
                            ✓ Unit tests added
                          </div>
                        )}
                        {selectedTask.progress < 100 && (
                          <div className="flex items-center space-x-2 text-orange-500">
                            <Loader2 />
                            <span>Working on implementation...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* For completed tasks, show results */
                  <div className="space-y-4">
                    {/* Task description */}
                    {selectedTask.description && (
                      <div className="rounded-lg bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-700">
                          {selectedTask.description}
                        </p>
                      </div>
                    )}

                    {/* Files generated */}
                    {selectedTask.files && selectedTask.files.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                          Files Generated
                        </h3>
                        {selectedTask.files.map((file, index) => (
                          <div
                            key={index}
                            className="overflow-hidden rounded-lg bg-white shadow-sm"
                          >
                            <button
                              onClick={() => {
                                setSelectedTask((prev) => ({
                                  ...prev,
                                  expandedFile:
                                    prev.expandedFile === file.name
                                      ? null
                                      : file.name,
                                }));
                              }}
                              className="flex w-full items-center justify-between rounded-md bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                            >
                              <div className="flex items-center space-x-2">
                                <FileText />
                                <span className="text-sm font-medium text-gray-900">
                                  {file.name}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-green-600">
                                +{file.additions}
                                {file.deletions > 0 ? `-${file.deletions}` : ""}
                              </span>
                            </button>

                            {/* Expandable code preview */}
                            {selectedTask.expandedFile === file.name && (
                              <div className="border-t border-gray-200 bg-white p-4">
                                <div className="rounded bg-gray-50 p-4 font-mono text-xs">
                                  {file.name.endsWith(".py") && (
                                    <div className="space-y-1">
                                      <div>
                                        <span className="text-purple-600">
                                          import
                                        </span>
                                        <span className="text-gray-800">
                                          {" "}
                                          pandas{" "}
                                        </span>
                                        <span className="text-purple-600">
                                          as
                                        </span>
                                        <span className="text-gray-800">
                                          {" "}
                                          pd
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-purple-600">
                                          import
                                        </span>
                                        <span className="text-gray-800">
                                          {" "}
                                          numpy{" "}
                                        </span>
                                        <span className="text-purple-600">
                                          as
                                        </span>
                                        <span className="text-gray-800">
                                          {" "}
                                          np
                                        </span>
                                      </div>
                                      <div className="mt-3">
                                        <span className="text-purple-600">
                                          def{" "}
                                        </span>
                                        <span className="text-blue-600">
                                          analyze_data
                                        </span>
                                        <span className="text-gray-800">
                                          (data):
                                        </span>
                                      </div>
                                      <div className="ml-4 text-gray-500">
                                        """Analyze user behavior data"""
                                      </div>
                                      <div className="ml-4">
                                        <span className="text-gray-800">
                                          df = pd.
                                        </span>
                                        <span className="text-blue-600">
                                          DataFrame
                                        </span>
                                        <span className="text-gray-800">
                                          (data)
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <span className="text-purple-600">
                                          return{" "}
                                        </span>
                                        <span className="text-gray-800">
                                          df.
                                        </span>
                                        <span className="text-blue-600">
                                          describe
                                        </span>
                                        <span className="text-gray-800">
                                          ()
                                        </span>
                                      </div>
                                      <div className="mt-3">
                                        <span className="text-purple-600">
                                          def{" "}
                                        </span>
                                        <span className="text-blue-600">
                                          generate_report
                                        </span>
                                        <span className="text-gray-800">
                                          (results):
                                        </span>
                                      </div>
                                      <div className="ml-4 text-gray-500">
                                        """Generate analysis report"""
                                      </div>
                                      <div className="ml-4">
                                        <span className="text-gray-800">
                                          metrics ={" "}
                                        </span>
                                        <span className="text-gray-800">
                                          {"{"}
                                        </span>
                                      </div>
                                      <div className="ml-8">
                                        <span className="text-pink-600">
                                          'focus_share'
                                        </span>
                                        <span className="text-gray-800">
                                          : results.
                                        </span>
                                        <span className="text-blue-600">
                                          mean
                                        </span>
                                        <span className="text-gray-800">
                                          (),
                                        </span>
                                      </div>
                                      <div className="ml-8">
                                        <span className="text-pink-600">
                                          'engagement'
                                        </span>
                                        <span className="text-gray-800">
                                          : results.
                                        </span>
                                        <span className="text-blue-600">
                                          sum
                                        </span>
                                        <span className="text-gray-800">
                                          (),
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <span className="text-gray-800">
                                          {"}"}
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <span className="text-purple-600">
                                          return{" "}
                                        </span>
                                        <span className="text-gray-800">
                                          metrics
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {file.name.endsWith(".tsx") && (
                                    <div className="space-y-1">
                                      <div className="text-pink-600">
                                        "use client";
                                      </div>
                                      <div className="mt-2">
                                        <span className="text-purple-600">
                                          import{" "}
                                        </span>
                                        <span className="text-gray-800">
                                          {"{ useState }"}
                                        </span>
                                        <span className="text-purple-600">
                                          {" "}
                                          from{" "}
                                        </span>
                                        <span className="text-pink-600">
                                          "react"
                                        </span>
                                        <span className="text-gray-800">;</span>
                                      </div>
                                      <div className="mt-3">
                                        <span className="text-purple-600">
                                          export default function{" "}
                                        </span>
                                        <span className="text-orange-600">
                                          Component
                                        </span>
                                        <span className="text-gray-800">
                                          {"() {"}
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <span className="text-purple-600">
                                          const{" "}
                                        </span>
                                        <span className="text-gray-800">
                                          [state, setState] ={" "}
                                        </span>
                                        <span className="text-blue-600">
                                          useState
                                        </span>
                                        <span className="text-gray-800">(</span>
                                        <span className="text-pink-600">
                                          ""
                                        </span>
                                        <span className="text-gray-800">
                                          );
                                        </span>
                                      </div>
                                      <div className="mt-2 ml-4">
                                        <span className="text-purple-600">
                                          return{" "}
                                        </span>
                                        <span className="text-gray-800">(</span>
                                      </div>
                                      <div className="ml-8">
                                        <span className="text-gray-600">
                                          {"<"}
                                        </span>
                                        <span className="text-blue-600">
                                          div
                                        </span>
                                        <span className="text-gray-600">
                                          {">"}
                                        </span>
                                      </div>
                                      <div className="ml-12">
                                        <span className="text-gray-600">
                                          {"<"}
                                        </span>
                                        <span className="text-blue-600">
                                          h1
                                        </span>
                                        <span className="text-gray-600">
                                          {">"}
                                        </span>
                                        <span className="text-gray-800">
                                          Component
                                        </span>
                                        <span className="text-gray-600">
                                          {"</"}
                                        </span>
                                        <span className="text-blue-600">
                                          h1
                                        </span>
                                        <span className="text-gray-600">
                                          {">"}
                                        </span>
                                      </div>
                                      <div className="ml-8">
                                        <span className="text-gray-600">
                                          {"</"}
                                        </span>
                                        <span className="text-blue-600">
                                          div
                                        </span>
                                        <span className="text-gray-600">
                                          {">"}
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <span className="text-gray-800">
                                          );
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-800">
                                          {"}"}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {!file.name.endsWith(".py") &&
                                    !file.name.endsWith(".tsx") && (
                                      <div className="space-y-1 text-gray-600">
                                        <div># Configuration file</div>
                                        <div>version: 1.0.0</div>
                                        <div>
                                          name:{" "}
                                          {file.name.replace(/\.[^/.]+$/, "")}
                                        </div>
                                        <div>author: AI Agent</div>
                                      </div>
                                    )}
                                </div>
                                <div className="mt-3 flex justify-end space-x-2">
                                  <button className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200">
                                    Copy Code
                                  </button>
                                  <button className="rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-orange-600">
                                    Open in Editor
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer input area */}
          <div className="no-drag border-t border-gray-200 bg-white p-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Plan, search, build anything..."
                className="focus:ring-opacity-20 flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
              />
              <button className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200">
                <span>∞ Agent</span>
                <ChevronUp />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Left side promotional content */}
      <div className="absolute top-1/2 left-12 max-w-sm -translate-y-1/2">
        <h1 className="mb-4 text-5xl font-bold text-gray-800">
          Agent turns ideas into code
        </h1>
        <p className="mb-6 text-xl text-gray-600">
          A human-AI programmer, orders of magnitude more effective than any
          developer alone.
        </p>
        <button className="flex items-center space-x-2 text-lg font-semibold text-orange-600 transition-colors hover:text-orange-700">
          <span>Learn about Agent</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default CursorAgentUI;
