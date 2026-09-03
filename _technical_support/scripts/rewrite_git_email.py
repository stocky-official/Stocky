import subprocess
import os

filter_script = '''
if [ "$GIT_AUTHOR_EMAIL" = "abdelrahman.mamdouh@stocky.com" ]; then
    export GIT_AUTHOR_EMAIL="stocky.admin@gmail.com"
fi
if [ "$GIT_COMMITTER_EMAIL" = "abdelrahman.mamdouh@stocky.com" ]; then
    export GIT_COMMITTER_EMAIL="stocky.admin@gmail.com"
fi
'''

res = subprocess.run(
    ["git", "filter-branch", "-f", "--env-filter", filter_script, "HEAD"],
    capture_output=True,
    text=True
)

print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
print("CODE:", res.returncode)
