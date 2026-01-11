// src/python/tracer.ts

export const PYTHON_TRACER_mV1 = `
import sys
import json
import inspect

class CodeTracer:
    def __init__(self):
        self.trace_data = []
        self.step_counter = 0
        self.MAX_STEPS = 1000  # 防止死循环

    def serialize_value(self, value):
        try:
            # 简化版序列化，避免循环引用
            if isinstance(value, (int, float, str, bool, type(None))):
                return value
            if isinstance(value, (list, tuple)):
                return [self.serialize_value(v) for v in value[:10]]  # 限制长度
            if isinstance(value, dict):
                return {str(k): self.serialize_value(v) for k, v in list(value.items())[:10]}
            return str(value)
        except:
            return "<unserializable>"

    def trace_calls(self, frame, event, arg):
        if event != 'call':
            return
        return self.trace_lines

    def trace_lines(self, frame, event, arg):
        if event not in ['line', 'return']:
            return
        
        if self.step_counter >= self.MAX_STEPS:
            sys.settrace(None)
            return

        # 过滤掉非用户代码 (比如文件名不是 <string> 或 <exec> 的)
        co = frame.f_code
        filename = co.co_filename
        if filename != '<string>' and filename != '<exec>':
            return

        self.step_counter += 1
        
        # 捕获局部变量
        locals_snapshot = {}
        for k, v in frame.f_locals.items():
            if not k.startswith('__'):
                locals_snapshot[k] = self.serialize_value(v)

        self.trace_data.append({
            'step': self.step_counter,
            'line': frame.f_lineno,
            'event': event,
            'func_name': co.co_name,
            'locals': locals_snapshot
        })

    def run(self, code):
        self.trace_data = []
        self.step_counter = 0
        
        # 编译代码
        try:
            compiled_code = compile(code, "<string>", "exec")
        except SyntaxError as e:
            return json.dumps({
                "error": "SyntaxError",
                "message": str(e),
                "lineno": e.lineno
            })

        # 执行并追踪
        sys.settrace(self.trace_calls)
        try:
            exec(compiled_code, {})
        except Exception as e:
            self.trace_data.append({
                'event': 'exception',
                'error_type': type(e).__name__,
                'message': str(e)
            })
        finally:
            sys.settrace(None)
        
        return json.dumps(self.trace_data)

# 实例化全局 Tracer
_global_tracer = CodeTracer()
`;
