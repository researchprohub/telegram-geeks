"""Debug remaining service signatures."""
import sys
sys.stderr = sys.stdout
import inspect

from telegram_layer.src.actions.contact_book import ContactBookService
cb = ContactBookService()
sig = inspect.signature(cb.add_contact)
print("ContactBook.add_contact:", list(sig.parameters.keys()))

from telegram_layer.src.actions.reactions import ReactionsService
rs = ReactionsService()
sig2 = inspect.signature(rs.add_reaction)
print("Reactions.add_reaction:", list(sig2.parameters.keys()))

from telegram_layer.src.actions.stories import StoriesService
ss = StoriesService()
sig3 = inspect.signature(ss.publish_story)
print("Stories.publish_story:", list(sig3.parameters.keys()))

from telegram_layer.src.actions.message_editor import MessageEditorService
me = MessageEditorService()
sig4 = inspect.signature(me.edit_message)
print("MessageEditor.edit_message:", list(sig4.parameters.keys()))

from telegram_layer.src.actions.channel_comments import ChannelCommentsService
ccs = ChannelCommentsService()
sig5 = inspect.signature(ccs.post_comments)
print("ChannelComments.post_comments:", list(sig5.parameters.keys()))

from telegram_layer.src.actions.anti_detection import AntiDetectionService
ads = AntiDetectionService()
sig6 = inspect.signature(ads.create_behavior_profile)
print("AntiDetection.create_behavior_profile:", list(sig6.parameters.keys()))

from telegram_layer.src.actions.postbot import PostbotService
ps = PostbotService()
sig7 = inspect.signature(ps.create_posts)
print("Postbot.create_posts:", list(sig7.parameters.keys()))

from telegram_layer.src.actions.mass_unsubscriber import MassUnsubscriberService
mus = MassUnsubscriberService()
sig8 = inspect.signature(mus.unsubscribe_from_channels)
print("MassUnsubscriber.unsubscribe_from_channels:", list(sig8.parameters.keys()))

from telegram_layer.src.actions.open_dialogs import OpenDialogsService
ods = OpenDialogsService()
sig9 = inspect.signature(ods.get_all_dialogs)
print("OpenDialogs.get_all_dialogs:", list(sig9.parameters.keys()))

from telegram_layer.src.actions.booster import BoosterService
bs = BoosterService()
sig10 = inspect.signature(bs.run_warmup_cycle)
print("Booster.run_warmup_cycle:", list(sig10.parameters.keys()))

from telegram_layer.src.actions.calculator_reports import CalculatorReportsService
crs = CalculatorReportsService()
sig11 = inspect.signature(crs.calculate_engagement_score)
print("CalculatorReports.calculate_engagement_score:", list(sig11.parameters.keys()))
