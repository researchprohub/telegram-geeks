import subprocess
result = subprocess.run(
    ["docker", "exec", "telegram-geeks-backend-1", "python", "-c",
     "import sys; sys.path.insert(0,'/app'); from app.services.infrastructure import Infrastructure; i = Infrastructure(); s = i._resolve_service('neuro_text'); print(type(s)); print(dir(s))"],
    capture_output=True, text=True
)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
