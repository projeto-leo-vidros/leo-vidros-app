import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu as MuiMenu,
  MenuItem,
  Divider,
  Fade,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  ButtonBase,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronDown,
  LogOut,
  UserCircle,
} from "lucide-react";
import Logo from "../../../assets/logo.png";
import DefaultAvatar from "../../../assets/Avatar.jpg";
import { useUser } from "../../../context/UserContext.jsx";
import { useQueryClient } from "@tanstack/react-query";

export default function Header({ toggleSidebar, sidebarOpen: _sidebarOpen }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const { user, logout } = useUser();
  const queryClient = useQueryClient();
  const userName = user.name || "Usuário Léo Vidros";
  const userEmail = user.email || "";
  const userPhoto = user.photo || DefaultAvatar;

  const handleProfileClick = (event) => {
    setAnchorEl((current) =>
      current === event.currentTarget ? null : event.currentTarget
    );
  };

  const handleProfileClose = () => setAnchorEl(null);

  const handleLogout = useCallback(() => {
    handleProfileClose();
    logout();
    queryClient.clear();
    navigate("/login");
  }, [logout, queryClient, navigate]);

  const menuItemStyle = {
    paddingY: "10px",
    paddingX: "16px",
    marginX: "8px",
    borderRadius: "8px",
    transition: "background-color 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
  };

  const iconStyle = {
    minWidth: "40px",
    color: "rgba(255, 255, 255, 0.8)",
  };

  const textStyle = {
    fontSize: "0.9rem",
    fontWeight: 500,
  };

  return (
    <AppBar
      position="fixed"
      elevation={2}
      sx={{ bgcolor: "#002A4B", zIndex: (theme) => theme.zIndex.drawer + 2 }}
      className="shadow-lg z-1100"
    >
      <Toolbar
        sx={{ minHeight: { xs: 58, sm: 62, md: 66 } }}
        className="
          flex justify-between items-center
          px-3 sm:px-5 md:px-7
        "
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <IconButton
            color="inherit"
            onClick={toggleSidebar}
            size="small"
            className="mr-0.5"
          >
            <MenuIcon size={22} />
          </IconButton>

          <img
            src={Logo}
            alt="Logo Léo Vidros"
            className="h-8 sm:h-9 md:h-10 cursor-pointer transition-all duration-300 hover:opacity-80"
            onClick={() => navigate("/pagina-inicial")}
          />
        </div>

        <ButtonBase
          aria-controls={open ? "header-profile-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-haspopup="menu"
          className="group rounded-xl"
          onClick={handleProfileClick}
          sx={{
            borderRadius: "14px",
            padding: { xs: "6px 8px", sm: "8px 10px" },
            transition: "background-color 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.08)",
            },
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm sm:text-base font-semibold leading-tight text-white transition-colors group-hover:text-gray-200">
                {userName}
              </p>
              <p className="text-xs sm:text-sm leading-tight text-gray-300">
                Administrador
              </p>
            </div>

            <Avatar
              src={userPhoto}
              sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 } }}
              className="flex-shrink-0 border-2 border-white transition-colors group-hover:border-gray-300"
            />

            <ChevronDown
              className={`hidden text-white transition-transform duration-300 group-hover:text-gray-300 sm:block ${
                open ? "rotate-180" : "rotate-0"
              }`}
              size={14}
            />
          </div>
        </ButtonBase>

        <MuiMenu
          id="header-profile-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleProfileClose}
          TransitionComponent={Fade}
          keepMounted
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              bgcolor: "#003d6b",
              color: "white",
              borderRadius: "16px",
              minWidth: 260,
              marginTop: "10px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
              overflow: "hidden",
            },
          }}
          MenuListProps={{
            sx: {
              paddingY: 0,
            },
          }}
        >
          <Box className="flex items-center gap-3 px-4 py-5">
            <Avatar
              src={userPhoto}
              className="w-12 h-12 border-2 border-white"
            />
            <div>
              <Typography
                variant="subtitle1"
                className="font-semibold leading-tight"
              >
                {userName}
              </Typography>
              <Typography
                variant="body2"
                className="leading-tight text-gray-300"
              >
                {userEmail}
              </Typography>
            </div>
          </Box>

          <Divider
            sx={{ borderColor: "rgba(255, 255, 255, 0.1)", marginX: "8px" }}
          />

          <Box sx={{ paddingY: "8px" }}>
            <MenuItem
              onClick={() => {
                handleProfileClose();
                navigate("/perfil");
              }}
              sx={menuItemStyle}
            >
              <ListItemIcon sx={iconStyle}>
                <UserCircle size={20} />
              </ListItemIcon>
              <ListItemText
                primary="Meu Perfil"
                primaryTypographyProps={textStyle}
              />
            </MenuItem>

            <Divider
              sx={{
                borderColor: "rgba(255, 255, 255, 0.1)",
                marginY: "8px",
                marginX: "8px",
              }}
            />

            <MenuItem onClick={handleLogout} sx={menuItemStyle}>
              <ListItemIcon sx={iconStyle}>
                <LogOut size={20} />
              </ListItemIcon>
              <ListItemText primary="Sair" primaryTypographyProps={textStyle} />
            </MenuItem>
          </Box>
        </MuiMenu>
      </Toolbar>
    </AppBar>
  );
}
