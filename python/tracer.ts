// python/tracer.ts

export const PYTHON_TRACER_mV1 = `
import sys
import json
import traceback

class CodeTracer:
    def __init__(self):
        self.trace_data = []
        self.step_counter = 0
        self.MAX_STEPS = 1000
        self.MAX_COLLECTION_SIZE = 10  # 限制列表/字典大小
        self.MAX_STRING_LENGTH = 50    # 限制字符串长度

    def serialize_value(self, value, depth=0):
        if depth > 2:  # 限制递归深度
            return "..."
            
        try:
            if isinstance(value, (int, float, bool, type(None))):
                return value
            if isinstance(value, str):
                if len(value) > self.MAX_STRING_LENGTH:
                    return value[:self.MAX_STRING_LENGTH] + "..."
                return value
            if isinstance(value, (list, tuple, set)):
                items = [self.serialize_value(v, depth + 1) for v in list(value)[:self.MAX_COLLECTION_SIZE]]
                if len(value) > self.MAX_COLLECTION_SIZE:
                    items.append(f"...(+{len(value) - self.MAX_COLLECTION_SIZE})")
                if isinstance(value, list): return items
                if isinstance(value, tuple): return {"__type": "tuple", "items": items}
                if isinstance(value, set): return {"__type": "set", "items": items}
            if isinstance(value, dict):
                items = {str(k): self.serialize_value(v, depth + 1) for k, v in list(value.items())[:self.MAX_COLLECTION_SIZE]}
                if len(value) > self.MAX_COLLECTION_SIZE:
                    items["__more"] = f"...(+{len(value) - self.MAX_COLLECTION_SIZE})"
                return items
            
            # 对于 DataFrame 等复杂对象，尝试获取其字符串表示
            type_name = type(value).__name__
            if hasattr(value, 'to_json'): # Pandas-like
                return {"__type": type_name, "repr": str(value)}
            
            return f"<{type_name}>"
        except:
            return "<unserializable>"

    def trace_func(self, frame, event, arg):
        # 过滤掉非用户代码
        if frame.f_code.co_filename != '<string>':
            return None
            
        if event == 'call':
            return self.trace_func
            
        if event not in ['line', 'return', 'exception']:
            return self.trace_func

        if self.step_counter >= self.MAX_STEPS:
            sys.settrace(None)
            self.trace_data.append({
                "status": "warning",
                "title": "执行截断",
                "desc": f"代码执行步骤超过 {self.MAX_STEPS} 步，已停止追踪。",
                "isError": False
            })
            raise StopExecution("Max steps reached")

        self.step_counter += 1
        
        # 捕获局部变量
        locals_snapshot = {}
        for k, v in frame.f_locals.items():
            if not k.startswith('__'): # 忽略内部变量
                locals_snapshot[k] = self.serialize_value(v)

        step_info = {
            'step': self.step_counter,
            'line': frame.f_lineno,
            'event': event,
            'locals': locals_snapshot,
            'func': frame.f_code.co_name
        }
        
        # 处理异常事件
        if event == 'exception':
            exc_type, exc_value, exc_traceback = arg
            step_info['exception'] = {
                'type': exc_type.__name__,
                'message': str(exc_value)
            }

        # 转换为前端 TraceStep 格式
        frontend_step = {
            "status": "success" if event != 'exception' else "error",
            "title": f"执行第 {frame.f_lineno} 行",
            "desc": f"函数: {frame.f_code.co_name}",
            "isError": event == 'exception',
            "line": frame.f_lineno,
            "variables": locals_snapshot
        }
        
        if event == 'exception':
            exc_type, exc_value, _ = arg
            frontend_step["title"] = f"运行时错误: {exc_type.__name__}"
            frontend_step["desc"] = str(exc_value)
            frontend_step["reason"] = str(exc_value)

        self.trace_data.append(frontend_step)
        return self.trace_func

    def run(self, code):
        self.trace_data = []
        self.step_counter = 0
        
        try:
            # 编译代码检查语法错误
            compiled_code = compile(code, "<string>", "exec")
            
            # 设置 Trace
            sys.settrace(self.trace_func)
            
            # 执行代码
            exec(compiled_code, {})
            
        except StopExecution:
            pass # 正常截断
        except SyntaxError as e:
            self.trace_data.append({
                "status": "error",
                "title": "语法错误",
                "desc": str(e),
                "isError": True,
                "line": e.lineno,
                "reason": e.msg
            })
        except Exception as e:
            # 这里的 Exception 捕获的是 exec 外部抛出的，或者 trace_func 没捕获到的
            # 通常 trace_func 会捕获内部异常，但如果是未捕获异常导致程序崩溃，这里作为最后一道防线
            tb_list = traceback.extract_tb(sys.exc_info()[2])
            # 找到最后一行用户代码
            user_line = -1
            for frame in tb_list:
                if frame.filename == '<string>':
                    user_line = frame.lineno
            
            self.trace_data.append({
                "status": "error",
                "title": f"未捕获异常: {type(e).__name__}",
                "desc": str(e),
                "isError": True,
                "line": user_line,
                "reason": str(e)
            })
        finally:
            sys.settrace(None)
        
        return json.dumps(self.trace_data)

class StopExecution(Exception):
    pass

_global_tracer = CodeTracer()
`;