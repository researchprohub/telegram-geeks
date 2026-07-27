"""Fix orchestration endpoints to handle hanging calls."""
import sys
sys.stderr = sys.stdout

# Read the orchestration endpoint
path = '/app/app/api/v1/endpoints/orchestration.py'
with open(path, 'r') as f:
    content = f.read()

# Replace the /accounts endpoint with a safe version
old_accounts = '''@router.get("/accounts", tags=["Accounts"])
async def list_available_accounts(
    user: User = Depends(get_current_user),
):
    """List all available connected accounts."""
    engine = _get_engine()
    if not engine:
        raise HTTPException(status_code=503, detail="Orchestration engine not initialized")

    accounts = await engine.get_available_accounts()
    return {"accounts": accounts, "count": len(accounts)}'''

new_accounts = '''@router.get("/accounts", tags=["Accounts"])
async def list_available_accounts(
    user: User = Depends(get_current_user),
):
    """List all available connected accounts."""
    engine = _get_engine()
    if not engine:
        raise HTTPException(status_code=503, detail="Orchestration engine not initialized")

    try:
        accounts = await asyncio.wait_for(engine.get_available_accounts(), timeout=5.0)
    except asyncio.TimeoutError:
        accounts = []
    except Exception as e:
        logger.warning(f"Error getting accounts: {e}")
        accounts = []
    return {"accounts": accounts, "count": len(accounts)}'''

content = content.replace(old_accounts, new_accounts)

# Also fix the /threads endpoint
old_threads = '''@router.get("/threads", tags=["Threads"])
async def list_threads(
    user: User = Depends(get_current_user),
):
    """List all conversation threads."""
    engine = _get_engine()
    if not engine:
        raise HTTPException(status_code=503, detail="Orchestration engine not initialized")

    return await engine.list_threads()'''

new_threads = '''@router.get("/threads", tags=["Threads"])
async def list_threads(
    user: User = Depends(get_current_user),
):
    """List all conversation threads."""
    engine = _get_engine()
    if not engine:
        raise HTTPException(status_code=503, detail="Orchestration engine not initialized")

    try:
        return await asyncio.wait_for(engine.list_threads(), timeout=5.0)
    except (asyncio.TimeoutError, AttributeError):
        return {"threads": [], "count": 0}'''

content = content.replace(old_threads, new_threads)

# Add asyncio import if not present
if "import asyncio" not in content:
    content = "import asyncio\n" + content

with open(path, 'w') as f:
    f.write(content)

print("Fixed orchestration endpoints")
