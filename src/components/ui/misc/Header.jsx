import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "./AppIcon";
import Button from "../Button/Button.component";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigationItems = [
    {
      label: "Dashboard",
      path: "/calendar-dashboard",
      icon: "Calendar",
      tooltip: "View and manage calendars",
    },
    {
      label: "Create Event",
      path: "/event-creation-and-management",
      icon: "Plus",
      tooltip: "Create new events and meetings",
    },
    {
      label: "Search Events",
      path: "/event-search-and-filtering",
      icon: "Search",
      tooltip: "Find and filter events",
    },
  ];

  const notifications = [
    {
      id: 1,
      type: "conflict",
      title: "Schedule Conflict",
      message: "Meeting with John overlaps with Team Standup",
      time: "2 min ago",
      urgent: true,
    },
    {
      id: 2,
      type: "rsvp",
      title: "RSVP Response",
      message: "Sarah accepted your meeting invitation",
      time: "15 min ago",
      urgent: false,
    },
    {
      id: 3,
      type: "reminder",
      title: "Meeting Reminder",
      message: "Quarterly Review starts in 30 minutes",
      time: "30 min ago",
      urgent: false,
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsProfileOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
    setIsNotificationOpen(false);
  };

  const handleLogout = () => {
    // Redirecionar para login (implementar lógica de logout conforme necessário)
    navigate("/login");
  };

  const urgentNotifications = notifications?.filter((n) => n?.urgent)?.length;

  return (
    <header className="fixed top-0 left-0 right-0 bg-surface border-b border-hairline z-header">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo Section */}
        <div className="flex items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-modern flex items-center justify-center">
              <Icon name="Calendar" size={20} color="white" />
            </div>
            <h1 className="text-xl font-semibold text-text-primary">
              Calendar Pro
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigationItems?.map((item) => {
            const isActive = location?.pathname === item?.path;
            return (
              <button
                key={item?.path}
                onClick={() => handleNavigation(item?.path)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-modern transition-micro hover-scale ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-text-secondary hover:text-text-primary hover:bg-muted"
                }`}
                title={item?.tooltip}
              >
                <Icon name={item?.icon} size={18} />
                <span className="font-medium">{item?.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* System Status */}
          <div className="hidden lg:flex items-center space-x-2 text-sm text-text-secondary">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span>All systems operational</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotificationClick}
              className="relative"
            >
              <Icon name="Bell" size={20} />
              {urgentNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-error-foreground text-xs rounded-full flex items-center justify-center">
                  {urgentNotifications}
                </span>
              )}
            </Button>

            {isNotificationOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-hairline rounded-modern shadow-soft z-dropdown">
                <div className="p-4 border-b border-hairline">
                  <h3 className="font-semibold text-text-primary">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications?.map((notification) => (
                    <div
                      key={notification?.id}
                      className={`p-4 border-b border-hairline hover:bg-muted transition-micro cursor-pointer ${
                        notification?.urgent ? "bg-error/5" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            notification?.urgent
                              ? "bg-error"
                              : "bg-muted-foreground"
                          }`}
                        ></div>
                        <div className="flex-1">
                          <h4 className="font-medium text-text-primary text-sm">
                            {notification?.title}
                          </h4>
                          <p className="text-text-secondary text-sm mt-1">
                            {notification?.message}
                          </p>
                          <span className="text-xs text-text-secondary mt-2 block">
                            {notification?.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-hairline">
                  <Button variant="ghost" size="sm" fullWidth>
                    View All Notifications
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={handleProfileClick}
              className="flex items-center space-x-2 px-3 py-2"
            >
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <Icon name="User" size={16} color="white" />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-text-primary">
                  John Smith
                </div>
                <div className="text-xs text-text-secondary">Administrator</div>
              </div>
              <Icon
                name="ChevronDown"
                size={16}
                className="text-text-secondary"
              />
            </Button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-hairline rounded-modern shadow-soft z-dropdown">
                <div className="p-4 border-b border-hairline">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <Icon name="User" size={20} color="white" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">
                        John Smith
                      </div>
                      <div className="text-sm text-text-secondary">
                        john.smith@company.com
                      </div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-muted transition-micro flex items-center space-x-2">
                    <Icon name="Settings" size={16} />
                    <span>Settings</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-muted transition-micro flex items-center space-x-2">
                    <Icon name="HelpCircle" size={16} />
                    <span>Help & Support</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-muted transition-micro flex items-center space-x-2">
                    <Icon name="Shield" size={16} />
                    <span>Privacy</span>
                  </button>
                </div>
                <div className="border-t border-hairline py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error/10 transition-micro flex items-center space-x-2"
                  >
                    <Icon name="LogOut" size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <Icon name="Menu" size={20} />
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-hairline bg-surface">
        <nav className="flex items-center justify-around py-2">
          {navigationItems?.map((item) => {
            const isActive = location?.pathname === item?.path;
            return (
              <button
                key={item?.path}
                onClick={() => handleNavigation(item?.path)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-modern transition-micro ${
                  isActive
                    ? "text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Icon name={item?.icon} size={20} />
                <span className="text-xs font-medium">{item?.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
