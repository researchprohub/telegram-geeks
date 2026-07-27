"""Check service signatures."""
import sys
sys.stderr = sys.stdout
from telegram_layer.src.actions.converter import ConverterService
import inspect
cs = ConverterService()
sig = inspect.signature(cs.convert_from_tdata)
print("convert_from_tdata:", list(sig.parameters.keys()))
sig2 = inspect.signature(cs.convert_to_tdata)
print("convert_to_tdata:", list(sig2.parameters.keys()))

from telegram_layer.src.actions.account_folders import AccountFolderService
afs = AccountFolderService()
sig3 = inspect.signature(afs.health_check_account)
print("health_check_account:", list(sig3.parameters.keys()))
