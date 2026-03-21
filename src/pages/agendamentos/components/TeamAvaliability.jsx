import Icon from "../../../components/ui/misc/AppIcon";
import Image from "../../../components/ui/misc/AppImage";

const TeamAvailability = () => {
  const teamMembers = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Lead Developer",
      avatar: "https://images.unsplash.com/photo-1684262855358-88f296a2cfc2",
      avatarAlt:
        "Professional headshot of woman with brown hair in white blazer smiling at camera",
      status: "available",
      nextMeeting: "2:00 PM - Sprint Planning",
      timezone: "EST",
    },
    {
      id: 2,
      name: "Mike Chen",
      role: "Product Manager",
      avatar: "https://images.unsplash.com/photo-1687256457585-3608dfa736c5",
      avatarAlt:
        "Professional headshot of Asian man with short black hair in navy suit",
      status: "busy",
      nextMeeting: "In Meeting - Product Review",
      timezone: "PST",
    },
    {
      id: 3,
      name: "Alex Rodriguez",
      role: "UX Designer",
      avatar: "https://images.unsplash.com/photo-1633116182067-e7326d3d409a",
      avatarAlt:
        "Professional headshot of Hispanic man with beard in casual shirt",
      status: "away",
      nextMeeting: "Back at 3:30 PM",
      timezone: "EST",
    },
    {
      id: 4,
      name: "Emily Davis",
      role: "QA Engineer",
      avatar: "https://images.unsplash.com/photo-1648466982925-65dac4ed0814",
      avatarAlt:
        "Professional headshot of blonde woman in business attire smiling",
      status: "available",
      nextMeeting: "4:00 PM - Testing Review",
      timezone: "CST",
    },
    {
      id: 5,
      name: "David Kim",
      role: "Backend Developer",
      avatar: "https://images.unsplash.com/photo-1663720527180-4c60a78fe3b7",
      avatarAlt: "Professional headshot of man with glasses in dark shirt",
      status: "busy",
      nextMeeting: "In Meeting - Code Review",
      timezone: "PST",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-success";
      case "busy":
        return "bg-error";
      case "away":
        return "bg-warning";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "available":
        return "Available";
      case "busy":
        return "Busy";
      case "away":
        return "Away";
      default:
        return "Unknown";
    }
  };

  const availableCount = teamMembers?.filter(
    (member) => member?.status === "available",
  )?.length;
  const busyCount = teamMembers?.filter(
    (member) => member?.status === "busy",
  )?.length;
  const awayCount = teamMembers?.filter(
    (member) => member?.status === "away",
  )?.length;

  return (
    <div className="bg-card border border-hairline rounded-modern p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary">Team Availability</h3>
        <button className="p-1 hover:bg-muted rounded-modern transition-micro">
          <Icon name="RefreshCw" size={16} />
        </button>
      </div>
      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-muted rounded-modern">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-xs font-medium text-text-primary">
              {availableCount}
            </span>
          </div>
          <div className="text-xs text-text-secondary">Available</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <div className="w-2 h-2 bg-error rounded-full"></div>
            <span className="text-xs font-medium text-text-primary">
              {busyCount}
            </span>
          </div>
          <div className="text-xs text-text-secondary">Busy</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            <span className="text-xs font-medium text-text-primary">
              {awayCount}
            </span>
          </div>
          <div className="text-xs text-text-secondary">Away</div>
        </div>
      </div>
      {/* Team Members List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {teamMembers?.map((member) => (
          <div
            key={member?.id}
            className="flex items-start space-x-3 p-2 hover:bg-muted rounded-modern transition-micro group"
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={member?.avatar}
                  alt={member?.avatarAlt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(member?.status)} rounded-full border-2 border-card`}
              ></div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary truncate">
                  {member?.name}
                </span>
                <span className="text-xs text-text-secondary">
                  {member?.timezone}
                </span>
              </div>

              <div className="text-xs text-text-secondary mb-1">
                {member?.role}
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    member?.status === "available"
                      ? "bg-success/10 text-success"
                      : member?.status === "busy"
                        ? "bg-error/10 text-error"
                        : "bg-warning/10 text-warning"
                  }`}
                >
                  {getStatusText(member?.status)}
                </span>
              </div>

              <div className="text-xs text-text-secondary mt-1 truncate">
                {member?.nextMeeting}
              </div>
            </div>

            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded-modern transition-micro">
              <Icon name="MessageCircle" size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-hairline">
        <button className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-primary hover:bg-primary/10 rounded-modern transition-micro">
          <Icon name="Users" size={16} />
          <span>View All Team</span>
        </button>
      </div>
    </div>
  );
};

export default TeamAvailability;
