import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import config from "../config";
import { Link, useNavigate } from "react-router-dom";
import "./sidebar.css";

function Sidebar() {
  const [user, setUser] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("กรุณาเข้าสู่ระบบก่อน", "กรุณาเข้าสู่ระบบก่อน", "warning");
      navigate("/");
      return;
    } else {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/user/info",
        config.headers()
      );

      if (res.data.result !== undefined) {
        setUser(res.data.result);
      }
    } catch (e) {
      Swal.fire("Error", "Error", "error");
    }
  };

  // ฟังก์ชันสำหรับตรวจสอบว่าเป็น owner หรือไม่
  const isOwner = () => {
    return user.status === "owner";
  };

  const handleSignOut = async () => {
    try {
      const button = await Swal.fire({
        title: "ออกจากระบบ",
        text: "ยืนยันการออกจากระบบ",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ใช่",
        cancelButtonText: "ยกเลิก",
      });

      if (button.isConfirmed) {
        localStorage.removeItem("token");
        Swal.fire({
          title: "ออกจากระบบ",
          text: "คุณออกจากระบบเรียบร้อยแล้ว.",
          icon: "success",
          timer: 1000, // แสดงผล 2 วินาที
          showConfirmButton: false, // ซ่อนปุ่มยืนยัน
        });
        navigate("/");
      }
    } catch (e) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดลองใหม่อีกครั้ง",
        icon: "error",
      });
    }
  };

  const displayStatusText = (status) => {
    const baseClass = "btn btn-success btn-sm ml-1";
    switch (status) {
      case "owner":
        return <div className={`${baseClass} bg-success`}>เจ้าของร้าน</div>;
      case "use":
        return <div className={`${baseClass} bg-info`}>พนักงาน</div>;
      case "delete":
        return <div className={`${baseClass} bg-danger`}>ลบบัญชี</div>;
      default:
        return <div className={`${baseClass} bg-secondary`}>ไม่มีสถานะ</div>;
    }
  };

  return (
    <>
      <aside class="main-sidebar sidebar-dark-primary elevation-4">
        <a href="" class="brand-link">
          <img
            src="dist/img/AdminLTELogo2.jpg"
            alt="AdminLTE Logo"
            class="brand-image img-circle elevation-3"
          />
          <span class="brand-text font-weight-light">ChicBorrow</span>
        </a>

        <div class="sidebar">
          <div class="user-panel d-flex align-items-center justify-content-between p-2">
            <nav className="mt-2">
              <ul
                className="nav nav-pills nav-sidebar flex-column"
                data-widget="treeview"
                role="menu"
                data-accordion="false"
              >
                <li className="nav-item">
                  <Link to="" className="nav-link">
                    <p>{displayStatusText(user.status)}</p>
                    <br />
                    <i className="nav-icon fas fa-user mt-3"></i>
                    <p>
                      {user.name} {/* แสดงชื่อผู้ใช้ */}
                      <br />
                      <span className="logout-btn">
                        <button
                          onClick={handleSignOut}
                          className="btn btn-danger btn-sm ml-1 mt-2"
                        >
                          <i className="fa fa-sign-out-alt mr-1"></i> ออกจากระบบ
                        </button>
                      </span>
                    </p>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <nav class="mt-2">
            <ul
              class="nav nav-pills nav-sidebar flex-column"
              data-widget="treeview"
              role="menu"
              data-accordion="false"
            >
              <li class="nav-header">รายงาน</li>
              <li class="nav-item">
                <Link to="/dashboard" class="nav-link">
                  <i class="nav-icon fas fa-chart-line"></i>
                  <p>แดชบอร์ด</p> {/* เปลี่ยนเป็นภาษาไทย */}
                </Link>
              </li>
              <li class="nav-header">การจัดการคำสั่งเช่า</li>
              <li class="nav-item">
                <Link to="/billSale" class="nav-link">
                  <i class="nav-icon fas fa-file-invoice-dollar"></i>
                  <p>รายงานการเช่า</p> {/* เปลี่ยนเป็นภาษาไทย */}
                </Link>
              </li>
              <li class="nav-header">การจัดการสินค้า</li>
              <li class="nav-item">
                <Link to="/product" class="nav-link">
                  <i class="nav-icon fas fa-box-open"></i>
                  <p>สินค้า</p> {/* เปลี่ยนเป็นภาษาไทย */}
                  <span class="badge badge-info right"></span>
                </Link>
              </li>
              <li class="nav-item">
                <Link to="/category" class="nav-link">
                  <i class="nav-icon fas fa-tags"></i>
                  <p>หมวดหมู่สินค้า</p> {/* เปลี่ยนเป็นภาษาไทย */}
                </Link>
              </li>
              <li class="nav-header">การจัดการร้าน</li>
              {isOwner() && (
                <>
                  <li class="nav-item">
                    <Link to="/user" class="nav-link">
                      <i class="nav-icon fas fa-user-shield"></i>
                      <p>แอดมิน</p> {/* เปลี่ยนเป็นภาษาไทย */}
                    </Link>
                  </li>
                  <li class="nav-item">
                    <Link to="/account" class="nav-link">
                      <i class="nav-icon fas fa-wallet"></i>
                      <p>บัญชีร้าน</p> {/* เปลี่ยนเป็นภาษาไทย */}
                    </Link>
                  </li>
                </>
              )}
              <li className="nav-item">
                <Link to="/rentaldays" className="nav-link">
                  <i className="nav-icon fas fa-calendar-alt"></i>
                  <p>โปรโมชั่น</p> {/* เปลี่ยนเป็นภาษาไทย */}
                </Link>
              </li>
              <li class="nav-header">การจัดการลูกค้า</li>
              <li class="nav-item">
                <Link to="/customer" class="nav-link">
                  <i class="nav-icon fas fa-users"></i>
                  <p>ลูกค้า</p> {/* เปลี่ยนเป็นภาษาไทย */}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
