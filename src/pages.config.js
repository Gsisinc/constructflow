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
import BidDetail from './pages/BidDetail';
import BidOpportunities from './pages/BidOpportunities';
import Bids from './pages/Bids';
import Budget from './pages/Budget';
import Calendar from './pages/Calendar';
import ClientPortal from './pages/ClientPortal';
import Dashboard from './pages/Dashboard';
import Issues from './pages/Issues';
import Materials from './pages/Materials';
import Onboarding from './pages/Onboarding';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import TimeCards from './pages/TimeCards';
import Directory from './pages/Directory';
import Estimates from './pages/Estimates';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BidDetail": BidDetail,
    "BidOpportunities": BidOpportunities,
    "Bids": Bids,
    "Budget": Budget,
    "Calendar": Calendar,
    "ClientPortal": ClientPortal,
    "Dashboard": Dashboard,
    "Issues": Issues,
    "Materials": Materials,
    "Onboarding": Onboarding,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "Tasks": Tasks,
    "Team": Team,
    "Settings": Settings,
    "Landing": Landing,
    "TimeCards": TimeCards,
    "Directory": Directory,
    "Estimates": Estimates,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};