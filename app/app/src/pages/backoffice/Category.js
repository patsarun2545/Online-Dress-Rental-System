import { useEffect, useState, useRef } from "react";
import BackOffice from "../../components/BackOffice";
import MyModal from "../../components/MyModal";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../../config";

function Category() {
  const [category, setCategory] = useState({}); // CREATE, UPDATE
  const [categories, setCategories] = useState([]); // SHOW
  const [fileExcel, setFileExcel] = useState({});
  const refExcel = useRef();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async () => {
    try {
      let res;

      if (category.id === undefined) {
        res = await axios.post(
          config.apiPath + "/api/categories",
          category,
          config.headers()
        );
      } else {
        res = await axios.put(
          config.apiPath + `/api/categories/${category.id}`,
          category,
          config.headers()
        );
      }

      if (res.data) {
        Swal.fire({
          title: "save",
          text: "success",
          icon: "success",
          timer: 1000,
        });
        document.getElementById("modalCategory_btnClose").click();
        fetchCategories();
        setCategory({ ...category, id: undefined }); // Clear id
      }
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/categories",
        config.headers()
      );

      if (res.data) {
        // เรียงลำดับให้สินค้าใหม่อยู่บนสุด (เช่นเรียงจาก ID มากไปน้อย)
        const sortedCategories = res.data.sort((a, b) => b.id - a.id);
        setCategories(sortedCategories);
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
    setCategory({
      name: "",
    });
  };

  const clearFormExcel = () => {
    refExcel.current.value = "";
    setFileExcel(null);
  };

  const selectedFileExcel = (fileInput) => {
    if (fileInput !== undefined && fileInput.length > 0) {
      setFileExcel(fileInput[0]);
    }
  };

  const handleUploadExcel = async () => {
    try {
      const formData = new FormData();
      formData.append("fileExcel", fileExcel);
  
      const res = await axios.post(
        config.apiPath + "/api/categories/uploadFromExcel",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: localStorage.getItem("token"),
          },
        }
      );
  
      if (res.data.message === "เพิ่มหมวดหมู่สำเร็จ") {
        Swal.fire({
          title: "สำเร็จ",
          text: "เพิ่มหมวดหมู่สำเร็จ",
          icon: "success",
          timer: 1000,
        });
        fetchCategories();
        document.getElementById("modalExcel_btnClose").click();
      }
    } catch (e) {
      const errorMessage = e.response?.data?.error || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
  
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: errorMessage,
        icon: "error",
      });
    }
  };
  

  const handleRemove = async (item) => {
    try {
      const button = await Swal.fire({
        text: "remove item",
        title: "remove",
        icon: "question",
        showCancelButton: true,
        showConfirmButton: true,
      });

      if (button.isConfirmed) {
        const res = await axios.delete(
          config.apiPath + `/api/categories/${item.id}`,
          config.headers()
        );

        if (res.status === 200 || res.status === 204) {
          Swal.fire({
            title: "remove",
            text: "remove success",
            icon: "success",
            timer: 1000,
          });

          fetchCategories();
        }
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const filteredCategories = categories.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString().includes(searchTerm);
    const matchesStatus = selectedStatus
      ? item.status === selectedStatus
      : true;

    return matchesSearch && matchesStatus;
  });

  const displayStatusText = (item) => {
    const baseClass =
      "badge text-white px-3 py-2 shadow-sm d-flex align-items-center justify-content-center";

    switch (item.status) {
      case "active":
        return <div className={`${baseClass} bg-success`}>ใช้งาน</div>;
      case "inactive":
        return <div className={`${baseClass} bg-danger `}>ไม่ใช้งาน</div>;
      default:
        return <div className={`${baseClass} bg-secondary`}>ไม่มีสถานะ</div>;
    }
  };

  return (
    <BackOffice>
      <div className="card">
        <div className="card-header">
          <h4 className="mb-3" style={{ fontSize: "20px", fontWeight: "bold" }}>
            หมวดหมู่สินค้า
          </h4>
          <div className="d-flex flex-wrap">
            <button
              onClick={clearForm}
              className="btn btn-primary mr-2 mb-2"
              data-toggle="modal"
              data-target="#modalCategory"
            >
              <i className="fa fa-plus mr-2"></i>เพิ่มหมวดหมู่สินค้า
            </button>
            <button
              onClick={clearFormExcel}
              className="btn btn-success mb-2"
              data-toggle="modal"
              data-target="#modalExcel"
            >
              <i className="fa fa-arrow-down mr-2"></i>นำเข้าไฟล์ Excel
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="ค้นหา ( ไอดี หรือชื่อหมวดหมู่ )"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <select
                className="form-control"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">-- สถานะหมวดหมู่ --</option>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ไม่ใช้งาน</option>
              </select>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th width="50px" className="text-center">
                    ไอดี
                  </th>
                  <th>ชื่อหมวดหมู่</th>
                  <th width="100px" className="text-center">
                    สถานะ
                  </th>
                  <th width="115px" className="text-center">
                    แก้ไข / ลบ
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((item) => (
                    <tr key={item.id}>
                      <td className="text-center">{item.id}</td>
                      <td>{item.name}</td>
                      <td>{displayStatusText(item)}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-primary mr-2"
                          data-toggle="modal"
                          data-target="#modalCategory"
                          onClick={(e) => setCategory(item)}
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
                    <td colSpan="4" className="text-center">
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MyModal id="modalCategory" title="ข้อมูลประเภทสินค้า">
        <div>
          <div>ชื่อประเภทสินค้า</div>
          <input
            value={category.name || ""}
            className="form-control"
            onChange={(e) => setCategory({ ...category, name: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <div>สถานะบัญชี</div>
          <select
            value={category.status || ""}
            className="form-control"
            onChange={(e) => setCategory({ ...category, status: e.target.value })}
          >
            <option value="active">ใช้งาน</option>
            <option value="inactive">ไม่ใช้งาน</option>
          </select>
        </div>
        <div className="mt-3">
          <button className="btn btn-primary" onClick={handleSave}>
            <i className="fa fa-check mr-2"></i>บันทึก
          </button>
        </div>
      </MyModal>

      <MyModal id="modalExcel" title="นำเข้าไฟล์ Excel">
        <div>
          <div>เลือกไฟล์ Excel</div>
          <input
            type="file"
            ref={refExcel}
            className="form-control"
            onChange={(e) => selectedFileExcel(e.target.files)}
          />
        </div>
        <div className="mt-3">
          <button className="btn btn-primary" onClick={handleUploadExcel}>
            <i className="fa fa-upload mr-2"></i>อัพโหลด
          </button>
        </div>
      </MyModal>
    </BackOffice>
  );
}

export default Category;
