/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Invoices from './pages/Invoices';
import JobCosting from './pages/JobCosting';
import AIAgents from './pages/AIAgents';
import ClientPortal from './pages/ClientPortal';
import DailyLog from './pages/DailyLog';
import dashboardImprovedversion from './pages/Dashboard.ImprovedVersion';
import DocumentTracking from './pages/DocumentTracking';
import ESignatures from './pages/ESignatures';
import SystemBuilder from './pages/SystemBuilder';
import AIABilling from './pages/AIABilling';
import AIAgentsMultiPlatform from './pages/AIAgentsMultiPlatform';
import BidIntelligence from './pages/BidIntelligence';
import Bids from './pages/Bids';
import BillApprovals from './pages/BillApprovals';
import Budget from './pages/Budget';
import CertificationRoadmap from './pages/CertificationRoadmap';
import CostLibrary from './pages/CostLibrary';
import GSISWebsite from './pages/GSISWebsite';
import BidDetail from './pages/BidDetail';
import Dashboard from './pages/Dashboard';
import JoinRequest from './pages/JoinRequest';
import Landing from './pages/Landing';
import LessonPlanTemplates from './pages/LessonPlanTemplates';
import LienWaivers from './pages/LienWaivers';
import Login from './pages/Login';
import Materials from './pages/Materials';
import Onboarding from './pages/Onboarding';
import OngoingTraining from './pages/OngoingTraining';
import PMSetupGuide from './pages/PMSetupGuide';
import Phase2Operations from './pages/Phase2Operations';
import Phase3Operations from './pages/Phase3Operations';
import Phase4AIAutomation from './pages/Phase4AIAutomation';
import Phase5PlatformScale from './pages/Phase5PlatformScale';
import Phase6ReliabilityOps from './pages/Phase6ReliabilityOps';
import Photos from './pages/Photos';
import ProjectDetail from './pages/ProjectDetail';
import PurchaseOrders from './pages/PurchaseOrders';
import QuickBooksSync from './pages/QuickBooksSync';
import RolePermissions from './pages/RolePermissions';
import SchedulingAI from './pages/SchedulingAI';
import ServiceDesk from './pages/ServiceDesk';
import Settings from './pages/Settings';
import Submittals from './pages/Submittals';
import SupportChannels from './pages/SupportChannels';
import TaskTracker from './pages/TaskTracker';
import Team from './pages/Team';
import TeamManagement from './pages/TeamManagement';
import TextMessages from './pages/TextMessages';
import Home from './pages/Home';
import Implementation from './pages/Implementation';
import AlertSettings from './pages/AlertSettings';
import AuditTrail from './pages/AuditTrail';
import SubcontractorPortal from './pages/SubcontractorPortal';
import TrainingManagement from './pages/TrainingManagement';
import TrainingMaterials from './pages/TrainingMaterials';
import TrainingSchedule from './pages/TrainingSchedule';
import UserApprovals from './pages/UserApprovals';
import VehicleLogs from './pages/VehicleLogs';
import aiagentsFixed from './pages/AIAgents-Fixed';
import aiagentsOpenaiClaude from './pages/AIAgents-OpenAI-Claude';
import BidOpportunities from './pages/BidOpportunities';
import Calendar from './pages/Calendar';
import Estimates from './pages/Estimates';
import FeatureTesting from './pages/FeatureTesting';
import FieldHoursApproval from './pages/FieldHoursApproval';
import Issues from './pages/Issues';
import biddiscoveryMobile from './pages/BidDiscovery-Mobile';
import BidDiscovery from './pages/BidDiscovery';
import BidOpportunityDetail from './pages/BidOpportunityDetail';
import CostPlusInvoicing from './pages/CostPlusInvoicing';
import Directory from './pages/Directory';
import Documents from './pages/Documents';
import EstimateGenerator from './pages/EstimateGenerator';
import Tasks from './pages/Tasks';
import AddBid from './pages/AddBid';
import Projects from './pages/Projects';
import Safety from './pages/Safety';
import TeamSkillsMatrix from './pages/TeamSkillsMatrix';
import TechnicianPortal from './pages/TechnicianPortal';
import TechnicianTraining from './pages/TechnicianTraining';
import TemplateLibrary from './pages/TemplateLibrary';
import TimeCards from './pages/TimeCards';
import GSISAboutPage from './pages/GSISAboutPage';
import GSISProjectsPage from './pages/GSISProjectsPage';
import GSISServiceDetailPage from './pages/GSISServiceDetailPage';
import GSISServicesPage from './pages/GSISServicesPage';
import GSISContactPage from './pages/GSISContactPage';
import GSISHomePage from './pages/GSISHomePage';
import GSISAboutPage from './pages/GSISAboutPage';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Invoices": Invoices,
    "JobCosting": JobCosting,
    "AIAgents": AIAgents,
    "ClientPortal": ClientPortal,
    "DailyLog": DailyLog,
    "Dashboard.ImprovedVersion": dashboardImprovedversion,
    "DocumentTracking": DocumentTracking,
    "ESignatures": ESignatures,
    "SystemBuilder": SystemBuilder,
    "AIABilling": AIABilling,
    "AIAgentsMultiPlatform": AIAgentsMultiPlatform,
    "BidIntelligence": BidIntelligence,
    "Bids": Bids,
    "BillApprovals": BillApprovals,
    "Budget": Budget,
    "CertificationRoadmap": CertificationRoadmap,
    "CostLibrary": CostLibrary,
    "GSISWebsite": GSISWebsite,
    "BidDetail": BidDetail,
    "Dashboard": Dashboard,
    "JoinRequest": JoinRequest,
    "Landing": Landing,
    "LessonPlanTemplates": LessonPlanTemplates,
    "LienWaivers": LienWaivers,
    "Login": Login,
    "Materials": Materials,
    "Onboarding": Onboarding,
    "OngoingTraining": OngoingTraining,
    "PMSetupGuide": PMSetupGuide,
    "Phase2Operations": Phase2Operations,
    "Phase3Operations": Phase3Operations,
    "Phase4AIAutomation": Phase4AIAutomation,
    "Phase5PlatformScale": Phase5PlatformScale,
    "Phase6ReliabilityOps": Phase6ReliabilityOps,
    "Photos": Photos,
    "ProjectDetail": ProjectDetail,
    "PurchaseOrders": PurchaseOrders,
    "QuickBooksSync": QuickBooksSync,
    "RolePermissions": RolePermissions,
    "SchedulingAI": SchedulingAI,
    "ServiceDesk": ServiceDesk,
    "Settings": Settings,
    "Submittals": Submittals,
    "SupportChannels": SupportChannels,
    "TaskTracker": TaskTracker,
    "Team": Team,
    "TeamManagement": TeamManagement,
    "TextMessages": TextMessages,
    "Home": Home,
    "Implementation": Implementation,
    "AlertSettings": AlertSettings,
    "AuditTrail": AuditTrail,
    "SubcontractorPortal": SubcontractorPortal,
    "TrainingManagement": TrainingManagement,
    "TrainingMaterials": TrainingMaterials,
    "TrainingSchedule": TrainingSchedule,
    "UserApprovals": UserApprovals,
    "VehicleLogs": VehicleLogs,
    "AIAgents-Fixed": aiagentsFixed,
    "AIAgents-OpenAI-Claude": aiagentsOpenaiClaude,
    "BidOpportunities": BidOpportunities,
    "Calendar": Calendar,
    "Estimates": Estimates,
    "FeatureTesting": FeatureTesting,
    "FieldHoursApproval": FieldHoursApproval,
    "Issues": Issues,
    "BidDiscovery-Mobile": biddiscoveryMobile,
    "BidDiscovery": BidDiscovery,
    "BidOpportunityDetail": BidOpportunityDetail,
    "CostPlusInvoicing": CostPlusInvoicing,
    "Directory": Directory,
    "Documents": Documents,
    "EstimateGenerator": EstimateGenerator,
    "Tasks": Tasks,
    "AddBid": AddBid,
    "Projects": Projects,
    "Safety": Safety,
    "TeamSkillsMatrix": TeamSkillsMatrix,
    "TechnicianPortal": TechnicianPortal,
    "TechnicianTraining": TechnicianTraining,
    "TemplateLibrary": TemplateLibrary,
    "TimeCards": TimeCards,
    "GSISAboutPage": GSISAboutPage,
    "GSISProjectsPage": GSISProjectsPage,
    "GSISServiceDetailPage": GSISServiceDetailPage,
    "GSISServicesPage": GSISServicesPage,
    "GSISContactPage": GSISContactPage,
    "GSISHomePage": GSISHomePage,
    "GSISAboutPage": GSISAboutPage,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};