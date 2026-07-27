"""Check remaining service signatures."""
import sys
sys.stderr = sys.stdout
import inspect

from telegram_layer.src.actions.reactions import ReactionsService
rs = ReactionsService(client_manager=None)
sig = inspect.signature(rs.add_reaction)
print("Reactions.add_reaction:", list(sig.parameters.keys()))

from telegram_layer.src.actions.stories import StoriesService
ss = StoriesService(client_manager=None)
sig2 = inspect.signature(ss.publish_story)
print("Stories.publish_story:", list(sig2.parameters.keys()))

from telegram_layer.src.actions.channel_comments import ChannelCommentsService
ccs = ChannelCommentsService(client_manager=None)
sig3 = inspect.signature(ccs.post_comments)
print("ChannelComments.post_comments:", list(sig3.parameters.keys()))

from telegram_layer.src.actions.anti_detection import AntiDetectionService
ads = AntiDetectionService(client_manager=None)
sig4 = inspect.signature(ads.create_behavior_profile)
print("AntiDetection.create_behavior_profile:", list(sig4.parameters.keys()))

from telegram_layer.src.actions.postbot import PostbotService
ps = PostbotService(client_manager=None)
sig5 = inspect.signature(ps.create_posts)
print("Postbot.create_posts:", list(sig5.parameters.keys()))

from telegram_layer.src.actions.mass_unsubscriber import MassUnsubscriberService
mus = MassUnsubscriberService(client_manager=None)
sig6 = inspect.signature(mus.unsubscribe_from_channels)
print("MassUnsubscriber.unsubscribe_from_channels:", list(sig6.parameters.keys()))

from telegram_layer.src.actions.open_dialogs import OpenDialogsService
ods = OpenDialogsService(client_manager=None)
sig7 = inspect.signature(ods.get_all_dialogs)
print("OpenDialogs.get_all_dialogs:", list(sig7.parameters.keys()))

from telegram_layer.src.actions.calculator_reports import CalculatorReportsService
crs = CalculatorReportsService()
sig8 = inspect.signature(crs.calculate_engagement_score)
print("CalculatorReports.calculate_engagement_score:", list(sig8.parameters.keys()))
