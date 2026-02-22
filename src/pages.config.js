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
import AIABilling from './pages/AIABilling';
import aiagentsFixed from './pages/AIAgents-Fixed';
import aiagentsOpenaiClaude from './pages/AIAgents-OpenAI-Claude';
import AIAgents from './pages/AIAgents';
import AIAgentsMultiPlatform from './pages/AIAgentsMultiPlatform';
import AddBid from './pages/AddBid';
import AlertSettings from './pages/AlertSettings';
import AuditTrail from './pages/AuditTrail';
import BidDetail from './pages/BidDetail';
import biddiscoveryMobile from './pages/BidDiscovery-Mobile';
import BidDiscovery from './pages/BidDiscovery';
import BidIntelligence from './pages/BidIntelligence';
import BidOpportunities from './pages/BidOpportunities';
import BidOpportunityDetail from './pages/BidOpportunityDetail';
import Bids from './pages/Bids';
import BillApprovals from './pages/BillApprovals';
import Budget from './pages/Budget';
import Calendar from './pages/Calendar';
import ClientPortal from './pages/ClientPortal';
import CostLibrary from './pages/CostLibrary';
import DailyLog from './pages/DailyLog';
import dashboardImprovedversion from './pages/Dashboard.ImprovedVersion';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import DocumentTracking from './pages/DocumentTracking';
import Documents from './pages/Documents';
import ESignatures from './pages/ESignatures';
import EstimateGenerator from './pages/EstimateGenerator';
import Estimates from './pages/Estimates';
import FeatureTesting from './pages/FeatureTesting';
import Home from './pages/Home';
import Implementation from './pages/Implementation';
import Invoices from './pages/Invoices';
import Issues from './pages/Issues';
import JoinRequest from './pages/JoinRequest';
import Landing from './pages/Landing';
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
import Projects from './pages/Projects';
import PurchaseOrders from './pages/PurchaseOrders';
import RolePermissions from './pages/RolePermissions';
import Safety from './pages/Safety';
import ServiceDesk from './pages/ServiceDesk';
import Settings from './pages/Settings';
import SubcontractorPortal from './pages/SubcontractorPortal';
import Submittals from './pages/Submittals';
import SupportChannels from './pages/SupportChannels';
import TaskTracker from './pages/TaskTracker';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import TeamManagement from './pages/TeamManagement';
import TemplateLibrary from './pages/TemplateLibrary';
import TextMessages from './pages/TextMessages';
import TimeCards from './pages/TimeCards';
import UserApprovals from './pages/UserApprovals';
import VehicleLogs from './pages/VehicleLogs';
import JobCosting from './pages/JobCosting';
import QuickBooksSync from './pages/QuickBooksSync';
import CostPlusInvoicing from './pages/CostPlusInvoicing';
import SchedulingAI from './pages/SchedulingAI';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIABilling": AIABilling,
    "AIAgents-Fixed": aiagentsFixed,
    "AIAgents-OpenAI-Claude": aiagentsOpenaiClaude,
    "AIAgents": AIAgents,
    "AIAgentsMultiPlatform": AIAgentsMultiPlatform,
    "AddBid": AddBid,
    "AlertSettings": AlertSettings,
    "AuditTrail": AuditTrail,
    "BidDetail": BidDetail,
    "BidDiscovery-Mobile": biddiscoveryMobile,
    "BidDiscovery": BidDiscovery,
    "BidIntelligence": BidIntelligence,
    "BidOpportunities": BidOpportunities,
    "BidOpportunityDetail": BidOpportunityDetail,
    "Bids": Bids,
    "BillApprovals": BillApprovals,
    "Budget": Budget,
    "Calendar": Calendar,
    "ClientPortal": ClientPortal,
    "CostLibrary": CostLibrary,
    "DailyLog": DailyLog,
    "Dashboard.ImprovedVersion": dashboardImprovedversion,
    "Dashboard": Dashboard,
    "Directory": Directory,
    "DocumentTracking": DocumentTracking,
    "Documents": Documents,
    "ESignatures": ESignatures,
    "EstimateGenerator": EstimateGenerator,
    "Estimates": Estimates,
    "FeatureTesting": FeatureTesting,
    "Home": Home,
    "Implementation": Implementation,
    "Invoices": Invoices,
    "Issues": Issues,
    "JoinRequest": JoinRequest,
    "Landing": Landing,
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
    "Projects": Projects,
    "PurchaseOrders": PurchaseOrders,
    "RolePermissions": RolePermissions,
    "Safety": Safety,
    "ServiceDesk": ServiceDesk,
    "Settings": Settings,
    "SubcontractorPortal": SubcontractorPortal,
    "Submittals": Submittals,
    "SupportChannels": SupportChannels,
    "TaskTracker": TaskTracker,
    "Tasks": Tasks,
    "Team": Team,
    "TeamManagement": TeamManagement,
    "TemplateLibrary": TemplateLibrary,
    "TextMessages": TextMessages,
    "TimeCards": TimeCards,
    "UserApprovals": UserApprovals,
    "VehicleLogs": VehicleLogs,
    "JobCosting": JobCosting,
    "QuickBooksSync": QuickBooksSync,
    "CostPlusInvoicing": CostPlusInvoicing,
    "SchedulingAI": SchedulingAI,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};