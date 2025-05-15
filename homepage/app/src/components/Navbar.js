import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import config from "../config";
import axios from "axios";
import Swal from "sweetalert2";
import "./Navbar.css";

function Navbar() {
  const [categories, setCategories] = useState([]);
  const [customer, setCustomer] = useState(null); // State for user data
  const [searchTerm, setSearchTerm] = useState(""); // State สำหรับเก็บคำค้นหา
  const [suggestions, setSuggestions] = useState([]); // เก็บคำแนะนำ
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const location = useLocation(); // ใช้เพื่อดึง URL ปัจจุบัน
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchCustomerData();
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryId = queryParams.get("category"); // ดึงค่า category จาก query string
    setSelectedCategoryId(categoryId ? parseInt(categoryId) : null); // อัปเดต State
  }, [location.search]); // ทำงานเมื่อ query string เปลี่ยน

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(config.apiPath + "/api/categories");
      const activeCategories = res.data.filter(
        (category) => category.status === "active"
      ); // กรองเฉพาะหมวดหมู่ที่ active
      setCategories(activeCategories); // ตั้งค่า categories เฉพาะที่ active
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:", error);
    }
  };

  // Fetch customer data
  const fetchCustomerData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // If no token, user is not logged in

    try {
      const res = await axios.get(config.apiPath + "/api/info", {
        headers: { Authorization: token },
      });
      setCustomer(res.data); // Set user data
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า:", error);
      localStorage.removeItem("token"); // Clear token if error occurs
    }
  };

  const handleLogout = async () => {
    try {
      // เรียก API ออกจากระบบ
      await axios.post(config.apiPath + "/api/logout");
      localStorage.removeItem("token");
      setCustomer(null); // Clear user data from state

      // แสดงข้อความยืนยันโดยไม่ต้องให้ผู้ใช้งานกด
      Swal.fire({
        title: "ออกจากระบบ",
        text: "คุณออกจากระบบเรียบร้อยแล้ว.",
        icon: "success",
        timer: 1000, // แสดงผล 2 วินาที
        showConfirmButton: false, // ซ่อนปุ่มยืนยัน
      });

      navigate("/home"); // เปลี่ยนเส้นทางไปยังหน้า Home
    } catch (error) {
      console.error("Logout error:", error);
      Swal.fire({
        title: "ข้อผิดพลาด",
        text: "ไม่สามารถออกจากระบบได้ โปรดลองอีกครั้ง",
        icon: "error",
      });
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId); // อัปเดตหมวดหมู่ที่เลือก
    navigate(`/home?category=${categoryId}`); // ส่งไปยัง Home พร้อม query string
  };

  // Handle search
  const handleSearch = () => {
    if (searchTerm.trim() !== "") {
      setSuggestions([]); // ล้างคำแนะนำ
      navigate(`/home?search=${searchTerm}`); // ส่งคำค้นหาไปที่ Home ผ่าน query string
    }
  };

  const fetchSuggestions = async (query) => {
    try {
      const res = await axios.get(
        config.apiPath + "/product/search/suggestions",
        {
          params: { query },
        }
      );
      setSuggestions(res.data); // อัปเดตคำแนะนำ
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงคำแนะนำ:", error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value); // อัปเดตค่าคำค้นหา
    if (value.trim() !== "") {
      fetchSuggestions(value); // ดึงคำแนะนำ
    } else {
      setSuggestions([]); // ล้างคำแนะนำหากไม่มีคำค้นหา
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.name); // ตั้งคำค้นหาตามคำแนะนำที่คลิก
    setSuggestions([]); // ล้างคำแนะนำ
    navigate(`/home?search=${suggestion.name}`); // เปลี่ยนไปหน้า Home พร้อมคำค้นหา
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
        <div className="container d-flex align-items-center justify-content-between">
          {/* Logo */}
          <Link to="/home" className="navbar-brand fw-bold me-4">
            ChicBorrow
          </Link>

          {/* Search Bar */}
          <div className="input-group search-bar w-50">
            <span className="input-group-text bg-white border-end-0 border-2 border-secondary rounded-start">
              🔥
            </span>
            <input
              type="text"
              className="form-control border-start-0 border-end-0 border-2 border-secondary"
              placeholder="ค้นหาชุดที่คุณสนใจ"
              value={searchTerm}
              // onChange={(e) => setSearchTerm(e.target.value)} // อัพเดท state ตามที่ป้อนไว้
              onChange={handleInputChange} // ใช้ฟังก์ชันใหม
            />
            <button
              className="btn btn-dark border-2 border-secondary rounded-end"
              onClick={handleSearch}
            >
              <i className="fas fa-search"></i>
            </button>

            {/* Autocomplete Suggestions */}
            {suggestions.length > 0 && (
              <ul
                className="list-group position-absolute w-100"
                style={{ zIndex: 1000, top: "100%", left: 0 }}
              >
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    className="list-group-item list-group-item-action"
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{ cursor: "pointer" }}
                  >
                    {suggestion.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Icons */}
          <div className="d-flex align-items-center gap-3">
            {/* User Dropdown */}
            <div className="dropdown">
              <i
                className="fas fa-user dropdown-toggle"
                id="userDropdown"
                data-bs-toggle="dropdown"
                style={{ cursor: "pointer" }}
              ></i>
              <ul
                className="dropdown-menu dropdown-menu-end"
                aria-labelledby="userDropdown"
              >
                {customer ? (
                  <>
                    <li>
                      <span className="dropdown-item-text">ผู้ใช้งาน</span>
                      <span className="dropdown-item-text">
                        {customer.name}
                      </span>
                    </li>
                    <li>
                      <Link to="/profile" className="dropdown-item">
                        บัญชีของฉัน
                      </Link>
                    </li>
                    <li>
                      <Link to="/orders" className="dropdown-item">
                        คำสั่งซื้อของฉัน
                      </Link>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        ออกจากระบบ
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link to="/singin" className="dropdown-item">
                        เข้าสู่ระบบ
                      </Link>
                    </li>
                    <li>
                      <Link to="/singup" className="dropdown-item">
                        สมัครสมาชิก
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Shopping Cart and Wishlist */}
            <Link to="/carts" className="text-dark">
              <i className="fas fa-shopping-cart"></i>
            </Link>
            <Link to="/heart" className="text-dark">
              <i className="fas fa-heart"></i>
            </Link>
            <Link to="/contact" className="text-dark">
              <i className="fas fa-phone"></i>
            </Link>
          </div>
        </div>
      </nav>

      {/* Category Menu */}
      <div className="bg-light py-2">
        <div className="container d-flex align-items-center gap-4">
          <span className="fw-bold text-secondary">หมวดหมู่</span>
          {categories.length > 0 ? (
            categories.map((category) => (
              <span
                key={category.id}
                className={`text-dark category-item ${
                  selectedCategoryId === category.id ? "active-category" : ""
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => handleCategoryClick(category.id)} // อัปเดตเมื่อคลิก
              >
                {category.name}
              </span>
            ))
          ) : (
            <span className="text-secondary">กำลังโหลด...</span>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
