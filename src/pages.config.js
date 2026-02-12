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
import AIAgents from './pages/AIAgents';
import AddBid from './pages/AddBid';
import AlertSettings from './pages/AlertSettings';
import BidOpportunities from './pages/BidOpportunities';
import Bids from './pages/Bids';
import Budget from './pages/Budget';
import Calendar from './pages/Calendar';
import DailyLog from './pages/DailyLog';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import Documents from './pages/Documents';
import Estimates from './pages/Estimates';
import Home from './pages/Home';
import Invoices from './pages/Invoices';
import Issues from './pages/Issues';
import JoinRequest from './pages/JoinRequest';
import Materials from './pages/Materials';
import Onboarding from './pages/Onboarding';
import PMSetupGuide from './pages/PMSetupGuide';
import Phase2Operations from './pages/Phase2Operations';
import Phase3Operations from './pages/Phase3Operations';
import Photos from './pages/Photos';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import PurchaseOrders from './pages/PurchaseOrders';
import RolePermissions from './pages/RolePermissions';
import Safety from './pages/Safety';
import Settings from './pages/Settings';
import Submittals from './pages/Submittals';
import TaskTracker from './pages/TaskTracker';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import TeamManagement from './pages/TeamManagement';
import TemplateLibrary from './pages/TemplateLibrary';
import TimeCards from './pages/TimeCards';
import UserApprovals from './pages/UserApprovals';
import VehicleLogs from './pages/VehicleLogs';
import AuditTrail from './pages/AuditTrail';
import BidDetail from './pages/BidDetail';
import BidDiscovery from './pages/BidDiscovery';
import ClientPortal from './pages/ClientPortal';
import Phase4AIAutomation from './pages/Phase4AIAutomation';
import Phase5PlatformScale from './pages/Phase5PlatformScale';
import Phase6ReliabilityOps from './pages/Phase6ReliabilityOps';
import ServiceDesk from './pages/ServiceDesk';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAgents": AIAgents,
    "AddBid": AddBid,
    "AlertSettings": AlertSettings,
    "BidOpportunities": BidOpportunities,
    "Bids": Bids,
    "Budget": Budget,
    "Calendar": Calendar,
    "DailyLog": DailyLog,
    "Dashboard": Dashboard,
    "Directory": Directory,
    "Documents": Documents,
    "Estimates": Estimates,
    "Home": Home,
    "Invoices": Invoices,
    "Issues": Issues,
    "JoinRequest": JoinRequest,
    "Materials": Materials,
    "Onboarding": Onboarding,
    "PMSetupGuide": PMSetupGuide,
    "Phase2Operations": Phase2Operations,
    "Phase3Operations": Phase3Operations,
    "Photos": Photos,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "PurchaseOrders": PurchaseOrders,
    "RolePermissions": RolePermissions,
    "Safety": Safety,
    "Settings": Settings,
    "Submittals": Submittals,
    "TaskTracker": TaskTracker,
    "Tasks": Tasks,
    "Team": Team,
    "TeamManagement": TeamManagement,
    "TemplateLibrary": TemplateLibrary,
    "TimeCards": TimeCards,
    "UserApprovals": UserApprovals,
    "VehicleLogs": VehicleLogs,
    "AuditTrail": AuditTrail,
    "BidDetail": BidDetail,
    "BidDiscovery": BidDiscovery,
    "ClientPortal": ClientPortal,
    "Phase4AIAutomation": Phase4AIAutomation,
    "Phase5PlatformScale": Phase5PlatformScale,
    "Phase6ReliabilityOps": Phase6ReliabilityOps,
    "ServiceDesk": ServiceDesk,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};