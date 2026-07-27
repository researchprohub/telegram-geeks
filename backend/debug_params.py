"""Debug invite_by_numbers param issue."""
import sys
sys.stderr = sys.stdout
import inspect
from telegram_layer.src.actions.invite import InviteService
ivs = InviteService(client_manager=None)
sig = inspect.signature(ivs.invite_by_numbers)
print("Invite.invite_by_numbers params:", list(sig.parameters.keys()))

from telegram_layer.src.actions.audience_collector import AudienceCollectorService
acs = AudienceCollectorService(client_manager=None)
sig2 = inspect.signature(acs.collect_from_comments)
print("AudienceCollector.collect_from_comments params:", list(sig2.parameters.keys()))

from telegram_layer.src.actions.contact_book import ContactBookService
cb = ContactBookService(client_manager=None)
sig3 = inspect.signature(cb.add_contact)
print("ContactBook.add_contact params:", list(sig3.parameters.keys()))

from telegram_layer.src.actions.reactions import ReactionsService
rs = ReactionsService(client_manager=None)
sig4 = inspect.signature(rs.add_reaction)
print("Reactions.add_reaction params:", list(sig4.parameters.keys()))

from telegram_layer.src.actions.stories import StoriesService
ss = StoriesService(client_manager=None)
sig5 = inspect.signature(ss.publish_story)
print("Stories.publish_story params:", list(sig5.parameters.keys()))

from telegram_layer.src.actions.channel_comments import ChannelCommentsService
ccs = ChannelCommentsService(client_manager=None)
sig6 = inspect.signature(ccs.post_comments)
print("ChannelComments.post_comments params:", list(sig6.parameters.keys()))

from telegram_layer.src.actions.postbot import PostbotService
ps = PostbotService(client_manager=None)
sig7 = inspect.signature(ps.create_posts)
print("Postbot.create_posts params:", list(sig7.parameters.keys()))

from telegram_layer.src.actions.mass_unsubscriber import MassUnsubscriberService
mus = MassUnsubscriberService(client_manager=None)
sig8 = inspect.signature(mus.unsubscribe_from_channels)
print("MassUnsubscriber.unsubscribe_from_channels params:", list(sig8.parameters.keys()))

from telegram_layer.src.actions.anti_detection import AntiDetectionService
ads = AntiDetectionService(client_manager=None)
sig9 = inspect.signature(ads.create_behavior_profile)
print("AntiDetection.create_behavior_profile params:", list(sig9.parameters.keys()))

from telegram_layer.src.actions.mass_messaging import MassMessagingService
mm = MassMessagingService(client_manager=None)
sig10 = inspect.signature(mm.send_to_database)
print("MassMessaging.send_to_database params:", list(sig10.parameters.keys()))

from telegram_layer.src.actions.calculator_reports import CalculatorReportsService
crs = CalculatorReportsService()
sig11 = inspect.signature(crs.calculate_engagement_score)
print("CalculatorReports.calculate_engagement_score params:", list(sig11.parameters.keys()))

from telegram_layer.src.actions.persona_manager import PersonaOrchestrator
po = PersonaOrchestrator()
sig12 = inspect.signature(po.generate_post)
print("PersonaOrchestrator.generate_post params:", list(sig12.parameters.keys()))
