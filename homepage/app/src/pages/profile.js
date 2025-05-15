import { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import BackOffice from "../components/BackOffice";
import "./sign.css";

function Profile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pass: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNo: "",
  });

  // ตรวจสอบการล็อกอิน
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("กรุณาเข้าสู่ระบบก่อน", "กรุณาเข้าสู่ระบบก่อน", "warning");
      navigate("/singin"); // เปลี่ยนเส้นทางไปยังหน้าเข้าสู่ระบบ
      return;
    }

    fetchUserData(); // ดึงข้อมูลผู้ใช้เมื่อผู้ใช้ล็อกอินแล้ว
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(config.apiPath + "/api/info", {
        headers: { Authorization: token },
      });

      // Ensure to set 'id' in the formData
      setFormData({
        id: res.data.id, // Include the ID here
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone || "",
        address: res.data.address || "",
        pass: "", // Password left blank for security
        bankName: res.data.bankName || "",
        bankAccountName: res.data.bankAccountName || "",
        bankAccountNo: res.data.bankAccountNo || "",
      });
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", error);
      Swal.fire("Error", "ดึงข้อมูลผู้ใช้ไม่สำเร็จ", "error");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        config.apiPath + "/api/customers/" + formData.id,
        { ...formData },
        { headers: { Authorization: token } }
      );

      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "แก้ไขข้อมูลสำเร็จ!",
        timer: 1000, // แจ้งเตือนเป็นเวลา 3 วินาที
        showConfirmButton: false, // ซ่อนปุ่ม OK
      });

      navigate("/profile");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "ไม่สามารถอัปเดตโปรไฟล์ได้",
        timer: 1000, // แจ้งเตือนเป็นเวลา 3 วินาที
        showConfirmButton: false, // ซ่อนปุ่ม OK
      });
    }
  };

  return (
    <BackOffice>
      <div className="hold-transition login-page">
        <div className="login-box">
          <div className="card">
            <div className="card-body login-card-body">
              <p className="login-box-msg">แก้ไขข้อมูลบัญชี</p>

              <form onSubmit={handleSubmit}>
                {/* Name Input */}
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ชื่อ"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-user"></span>
                    </div>
                  </div>
                </div>

                {/* Email Input */}
                <div className="input-group mb-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="อีเมล"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-envelope"></span>
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="input-group mb-3">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="รหัสผ่านใหม่"
                    name="pass"
                    value={formData.pass}
                    onChange={handleChange}
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-lock"></span>
                    </div>
                  </div>
                </div>

                {/* Phone Input */}
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="โทรศัพท์"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-phone"></span>
                    </div>
                  </div>
                </div>

                {/* Address Input */}
                <div className="input-group mb-3">
                  <textarea
                    className="form-control"
                    placeholder="ที่อยู่"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3" // จำนวนบรรทัดที่แสดง
                  ></textarea>
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-home"></span>
                    </div>
                  </div>
                </div>

                {/* Bank Name Input */}
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ชื่อธนาคาร"
                    name="bankName"
                    value={formData.bankName || ""}
                    onChange={handleChange}
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-university"></span>
                    </div>
                  </div>
                </div>

                {/* Bank Account Name Input */}
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ชื่อบัญชีธนาคาร"
                    name="bankAccountName"
                    value={formData.bankAccountName || ""}
                    onChange={handleChange}
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-user"></span>
                    </div>
                  </div>
                </div>

                {/* Bank Account Number Input */}
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เลขบัญชีธนาคาร"
                    name="bankAccountNo"
                    value={formData.bankAccountNo || ""}
                    onChange={handleChange}
                  />
                  <div className="input-group-append">
                    <div className="input-group-text">
                      <span className="fas fa-credit-card"></span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="row">
                  <div className="col-6">
                    <button type="submit" className="btn btn-primary btn-block">
                      บันทึก
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </BackOffice>
  );
}

export default Profile;
