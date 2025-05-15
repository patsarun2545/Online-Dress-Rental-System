import { useEffect, useState } from "react";
import BackOffice from "../../components/BackOffice";
import MyModal from "../../components/MyModal";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../../config";
import { useNavigate } from "react-router-dom";

function User() {
  const [user, setUser] = useState({}); // CREATE, UPDATE
  const [users, setUsers] = useState([]); // SHOW
  const [currentUser, setCurrentUser] = useState(null); // เก็บข้อมูลผู้ใช้ที่ล็อกอินอยู่
  const navigate = useNavigate();

  useEffect(() => {
    checkPermissionAndFetchData();
  }, []);

  // ตรวจสอบสิทธิ์และดึงข้อมูล
  const checkPermissionAndFetchData = async () => {
    try {
      // ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
      const userRes = await axios.get(
        config.apiPath + "/user/info",
        config.headers()
      );

      if (userRes.data.result) {
        setCurrentUser(userRes.data.result);

        // ตรวจสอบว่าเป็น owner หรือไม่
        if (userRes.data.result.status !== "owner") {
          Swal.fire({
            title: "ไม่มีสิทธิ์เข้าถึง",
            text: "เฉพาะเจ้าของร้านเท่านั้นที่สามารถจัดการข้อมูลผู้ใช้ได้",
            icon: "error",
            timer: 5000,
          });
          navigate("/dashboard");
          return;
        }

        // ถ้าเป็น owner ให้ดึงข้อมูลผู้ใช้ทั้งหมด
        fetchUsers();
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์",
        icon: "error",
      });
      navigate("/dashboard");
    }
  };

  const handleSave = async () => {
    try {
      // ตรวจสอบสิทธิ์อีกครั้งก่อนบันทึก
      if (currentUser?.status !== "owner") {
        Swal.fire({
          title: "ไม่มีสิทธิ์ดำเนินการ",
          text: "เฉพาะเจ้าของร้านเท่านั้นที่สามารถจัดการข้อมูลผู้ใช้ได้",
          icon: "error",
        });
        return;
      }

      let res;

      if (user.id === undefined) {
        res = await axios.post(
          config.apiPath + "/user/users",
          user,
          config.headers()
        );
      } else {
        res = await axios.put(
          config.apiPath + `/user/users/${user.id}`,
          user,
          config.headers()
        );
      }

      if (res.data) {
        Swal.fire({
          title: "บันทึกสำเร็จ",
          text: "บันทึกข้อมูลเรียบร้อยแล้ว",
          icon: "success",
          timer: 1000,
        });
        document.getElementById("modalCustomer_btnClose").click();
        fetchUsers();
        setUser({ ...user, id: undefined }); // Clear id
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const handleRemove = async (item) => {
    try {
      // ตรวจสอบสิทธิ์ก่อนลบ
      if (currentUser?.status !== "owner") {
        Swal.fire({
          title: "ไม่มีสิทธิ์ดำเนินการ",
          text: "เฉพาะเจ้าของร้านเท่านั้นที่สามารถลบข้อมูลผู้ใช้ได้",
          icon: "error",
        });
        return;
      }

      // ป้องกันการลบบัญชีตัวเอง
      if (item.id === currentUser.id) {
        Swal.fire({
          title: "ไม่สามารถดำเนินการได้",
          text: "ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่",
          icon: "warning",
        });
        return;
      }

      const button = await Swal.fire({
        text: "คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?",
        title: "ยืนยันการลบ",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
      });

      if (button.isConfirmed) {
        const res = await axios.delete(
          config.apiPath + `/user/users/${item.id}`,
          config.headers()
        );

        if (res.status === 200) {
          Swal.fire({
            title: "ลบสำเร็จ",
            text: "ลบข้อมูลผู้ใช้เรียบร้อยแล้ว",
            icon: "success",
            timer: 1000,
          });

          fetchUsers();
        }
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/user/users",
        config.headers()
      );

      if (res.data) {
        const sortedUsers = res.data.sort((a, b) => b.id - a.id);
        setUsers(sortedUsers);
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const clearForm = () => {
    setUser({
      name: "",
      user: "",
      pass: "",
    });
  };

  const displayStatusText = (item) => {
    const baseClass =
      "badge text-white px-3 py-2 shadow-sm d-flex align-items-center justify-content-center";

    switch (item.status) {
      case "use":
        return <div className={`${baseClass} bg-info`}>แอดมิน</div>;
      case "owner":
        return <div className={`${baseClass} bg-success`}>เจ้าของร้าน</div>;
      case "delete":
        return <div className={`${baseClass} bg-danger`}>ลบบัญชี</div>;
      default:
        return <div className={`${baseClass} bg-secondary`}>ไม่มีสถานะ</div>;
    }
  };

  return (
    <BackOffice>
      <div className="card">
        <div className="card-header">
          <h4 className="mb-3" style={{ fontSize: "20px", fontWeight: "bold" }}>
            แอดมิน
          </h4>
          <div className="d-flex flex-wrap">
            <button
              onClick={clearForm}
              className="btn btn-primary mr-2 mb-2"
              data-toggle="modal"
              data-target="#modalCustomer"
            >
              <i className="fa fa-plus mr-2"></i>เพิ่มบัญชีแอดมิน
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th width="50px" className="text-center">
                    ไอดี
                  </th>
                  <th>ชื่อ</th>
                  <th>ชื่อ หรือ อีเมล</th>
                  <th>รหัส</th>
                  <th width="100px" className="text-center">
                    สถานะ
                  </th>
                  <th width="115px" className="text-center">
                    แก้ไข / ลบ
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((item) => (
                    <tr key={item.id}>
                      <td className="text-center">{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.user}</td>
                      <td>{item.pass}</td>
                      <td>{displayStatusText(item)}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-primary mr-2"
                          data-toggle="modal"
                          data-target="#modalCustomer"
                          onClick={(e) => setUser(item)}
                        >
                          <i className="fa fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={(e) => handleRemove(item)}
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MyModal id="modalCustomer" title="ข้อมูลแอดมิน">
        <div>
          <div>ชื่อ</div>
          <input
            value={user.name || ""}
            className="form-control"
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <div>สถานะบัญชี</div>
          <select
            value={user.status || ""}
            className="form-control"
            onChange={(e) => setUser({ ...user, status: e.target.value })}
          >
            <option value="use">แอดมิน</option>
            <option value="owner">เจ้าของร้าน</option>
            <option value="delete">ลบบัญชี</option>
          </select>
        </div>
        <div className="mt-3">
          <div>ชื่อ หรือ อีเมล</div>
          <input
            value={user.user || ""}
            className="form-control"
            onChange={(e) => setUser({ ...user, user: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <div>รหัสผ่าน</div>
          <input
            type="password"
            value={user.pass || ""}
            className="form-control"
            onChange={(e) => setUser({ ...user, pass: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <button className="btn btn-primary" onClick={handleSave}>
            <i className="fa fa-check mr-2"></i>บันทึก
          </button>
        </div>
      </MyModal>
    </BackOffice>
  );
}

export default User;
