import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

type Task = {
  _id: Id<"tasks">;
  title: string;
  description?: string;
  status: "todo" | "inprogress" | "done";
  _creationTime: number;
};

export default function App() {
  const tasks: Task[] = useQuery(api.tasks.list) ?? [];
  const addTask = useMutation(api.tasks.add);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const removeTask = useMutation(api.tasks.remove);
  const generateTasks = useAction(api.generateTasks.generate);

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const sortedTasks = [...tasks].sort((a, b) => b._creationTime - a._creationTime);

  const tasksByStatus = {
    todo: sortedTasks.filter((t) => t.status === "todo"),
    inprogress: sortedTasks.filter((t) => t.status === "inprogress"),
    done: sortedTasks.filter((t) => t.status === "done"),
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      await generateTasks({ prompt });
      setPrompt("");
    } catch (err) {
      alert("Gemini error – check console");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Smart Taskboard</h1>

        {/* Gemini Generator */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Generate Tasks with Gemini</h2>
          <div className="flex gap-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create a 36h web app regarding governance that uses AI in a key way"
              className="flex-1 p-3 border rounded-lg resize-none"
              rows={3}
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Manual add */}
        <div className="bg-white rounded-lg shadow p-4 mb-8 flex gap-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newTitle && addTask({ title: newTitle })}
            placeholder="Add a task manually..."
            className="flex-1 p-3 border rounded"
          />
          <button
            onClick={() => newTitle && addTask({ title: newTitle }).then(() => setNewTitle(""))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["todo", "inprogress", "done"] as const).map((status) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-4 capitalize">
                {status === "todo" ? "To Do" : status === "inprogress" ? "In Progress" : "Done"}
                {" "}( {tasksByStatus[status].length} )
              </h3>
              <div className="space-y-3">
                {tasksByStatus[status].map((task) => (
                  <div key={task._id} className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="font-medium">{task.title}</div>
                    {task.description && <div className="text-sm text-gray-600 mt-1">{task.description}</div>}
                    <div className="flex items-center gap-2 mt-3">
                      <select
                        value={task.status}
                        onChange={(e) => updateStatus({ id: task._id, status: e.target.value as any })}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="todo">To Do</option>
                        <option value="inprogress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      <button
                        onClick={() => removeTask({ id: task._id })}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}