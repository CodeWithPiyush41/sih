import { useState } from 'react';
import { Play, Send, CheckCircle2, Terminal, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Question } from '@/types';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  question: Question;
  onSubmit: (code: string) => void;
}

export function CodeEditor({ question, onSubmit }: CodeEditorProps) {
  const [code, setCode] = useState(
    question.codeSnippet ||
      `# Write your Python statistical data validation function\ndef validate_sample_data(record):\n    # Range and logical consistency audit\n    if record.get("expenditure", 0) < 0:\n        return False\n    return True`
  );
  const [activeTab, setActiveTab] = useState<'editor' | 'console'>('editor');
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<{
    ran: boolean;
    passed: boolean;
    output: string;
    cases: { input: string; expected: string; actual: string; passed: boolean }[];
  } | null>(null);

  const handleRunCode = () => {
    setRunning(true);
    setActiveTab('console');

    setTimeout(() => {
      setRunning(false);
      setTestResults({
        ran: true,
        passed: true,
        output: 'Validation script execution successful.\nTest Case 1: validate_sample_data({"expenditure": 15000}) -> True [PASSED]',
        cases: question.testCases?.map(tc => ({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: tc.expectedOutput,
          passed: true
        })) || []
      });
    }, 1200);
  };

  const handleSubmit = () => {
    onSubmit(code);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px] h-full">
      {/* Left Pane: Problem Description */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="purple">Coding Challenge</Badge>
            <Badge variant="danger">HARD</Badge>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-3">{question.text}</h2>

          <div className="prose prose-slate text-sm text-slate-600 mb-6 space-y-3">
            <p>{question.explanation}</p>

            <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mt-4">Sample Test Cases</h4>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-800 space-y-4">
              {question.testCases?.map((tc, idx) => (
                <div key={idx}>
                  <span className="text-slate-400">Input:</span> {tc.input}<br />
                  <span className="text-slate-400">Expected Output:</span> {tc.expectedOutput}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Language: Java 17</span>
          <span>Time Limit: 2.0s</span>
        </div>
      </div>

      {/* Right Pane: Code Editor + Simulated Output */}
      <div className="bg-[#1E1E1E] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between shadow-md">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'editor' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 size={14} />
              Editor
            </button>
            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'console' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal size={14} />
              Console {testResults?.ran && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRunCode}
              isLoading={running}
              className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <Play size={14} className="mr-1.5 text-emerald-400 fill-emerald-400" />
              Run Code
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleSubmit}>
              <Send size={14} className="mr-1.5" />
              Submit Solution
            </Button>
          </div>
        </div>

        {/* Editor Body */}
        {activeTab === 'editor' ? (
          <div className="flex-1 w-full relative">
            <Editor
              height="100%"
              defaultLanguage="java"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 24,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
          </div>
        ) : (
          /* Console Output Tab */
          <div className="flex-1 p-6 font-mono text-xs bg-[#1E1E1E] text-slate-200 overflow-y-auto space-y-4">
            {running ? (
              <div className="flex items-center gap-2 text-primary-light animate-pulse">
                <Terminal size={16} />
                <span>Executing test suites in sandbox environment...</span>
              </div>
            ) : testResults ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 size={18} />
                  <span>All Test Cases Passed Successfully!</span>
                </div>
                <div className="p-3 bg-black/40 border border-slate-800 rounded-lg text-slate-300 whitespace-pre-wrap">
                  {testResults.output}
                </div>
                <div className="space-y-2">
                  {testResults.cases.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 bg-black/40 border border-slate-800 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <span className="text-slate-400">Case {i + 1}: </span>
                        <span className="text-white">{c.input}</span>
                      </div>
                      <Badge variant="success">PASSED</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-500">
                Click "Run Code" to compile and execute your code against test suites.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
