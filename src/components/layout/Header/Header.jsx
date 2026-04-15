import { useState } from "react";
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
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronDown,
  LogOut,
  UserCircle,
} from "lucide-react";
import Logo from "../../../assets/logo/logo.png";
import DefaultAvatar from "../../../assets/Avatar.jpg";
import { useUser } from "../../../context/UserContext.jsx";

export default function Header({ toggleSidebar, sidebarOpen }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const { user } = useUser();
  const userName = user.name || "Usuário Léo Vidros";
  const userEmail = user.email || "";
  const userPhoto = user.photo || DefaultAvatar;

  const handleProfileClick = (event) => setAnchorEl(event.currentTarget);
  const handleProfileClose = () => setAnchorEl(null);

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
      elevation={4}
      sx={{ bgcolor: "#002A4B" }}
      className="shadow-lg z-1100"
    >
      <Toolbar
        className="
          flex justify-between items-center
          min-h-65px sm:min-h-75px md:min-h-80px
          px-3 sm:px-6 md:px-10
          transition-all duration-300
        "
      >
        {/* Menu + Logo */}
        <div className="flex items-center">
          <IconButton
            color="inherit"
            onClick={toggleSidebar}
            className={`transition-transform duration-300 mr-2 ${
              sidebarOpen ? "rotate-90" : "rotate-0"
            }`}
          >
            <MenuIcon size={24} />
          </IconButton>
          <img
            src={Logo}
            alt="Logo Léo Vidros"
            className="h-8 sm:h-10 md:h-12 transition-all duration-300 cursor-pointer hover:opacity-80"
            onClick={() => navigate("/pagina-inicial")}
          />
        </div>

        {/* Usuário */}
        <div
          className="flex items-center gap-2 sm:gap-2 cursor-pointer group"
          onClick={handleProfileClick}
        >
          <div className="hidden sm:block text-right mr-1">
            <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-gray-200 transition-colors">
              {userName}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-300">Administador</p>
          </div>
          <Avatar
            src={userPhoto}
            className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 border-2 border-white group-hover:border-gray-300 transition-colors"
          />
          <ChevronDown
            className={`text-white transition-transform duration-300 group-hover:text-gray-300 ${
              open ? "rotate-180" : "rotate-0"
            } hidden sm:block`}
            size={20}
          />
        </div>

        {/* Menu suspenso */}
        <MuiMenu
          anchorEl={anchorEl}
          open={open}
          onClose={handleProfileClose}
          TransitionComponent={Fade}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              bgcolor: "#003d6b",
              color: "white",
              borderRadius: "16px",
              minWidth: 260,
              marginTop: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
              overflow: "hidden",
            },
          }}
        >
          {/* Seção de Perfil Destacada */}
          <Box className="flex items-center px-4 py-5 gap-3">
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
                className="text-gray-300 leading-tight"
              >
                {userEmail}
              </Typography>
            </div>
          </Box>

          <Divider
            sx={{ borderColor: "rgba(255, 255, 255, 0.1)", marginX: "8px" }}
          />

          {/* Itens de Menu */}
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

            <MenuItem
              onClick={() => {
                handleProfileClose();
                navigate("/");
              }}
              sx={menuItemStyle}
            >
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
