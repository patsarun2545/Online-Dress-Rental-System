import { useEffect, useRef, useState } from "react";
import BackOffice from "../../components/BackOffice";
import MyModal from "../../components/MyModal";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../../config";

function Product() {
  const [product, setProduct] = useState({}); // CREATE, UPDATE
  const [products, setProducts] = useState([]); // SHOW
  const [img, setImg] = useState({}); // File for Upload
  const [imgs, setImgs] = useState([]); // เก็บหลายไฟล์รูปภาพ
  const [fileExcel, setFileExcel] = useState({}); // File for Excel
  const refImg = useRef();
  const refExcel = useRef();
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // สำหรับการค้นหา
  const [selectedCategory, setSelectedCategory] = useState(""); // ตัวกรองหมวดหมู่สินค้า
  const [selectedStatus, setSelectedStatus] = useState(""); // ตัวกรองสถานะสินค้า
  const [imgPreviews, setImgPreviews] = useState([]);

  useEffect(() => {
    fetchData();
    fetchCategories();
    
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get("status");
  
    if (statusParam) {
      setSelectedStatus(statusParam); // กรองตามสถานะ "use" หรือ "reserved"
    }
  }, []);
  

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append("img", img);

      const res = await axios.post(
        config.apiPath + "/product/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: localStorage.getItem("token"),
          },
        }
      );

      if (res.data.newName !== undefined) {
        return res.data.newName;
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });

      return "";
    }
  };

  const handleSave = async () => {
    try {
      const uploadedImages = [];

      // อัปโหลดรูปภาพทีละไฟล์
      if (imgs.length > 0) {
        const uploadPromises = imgs.map(async (img) => {
          const formData = new FormData();
          formData.append("img", img);

          const res = await axios.post(
            config.apiPath + "/product/upload",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: localStorage.getItem("token"),
              },
            }
          );

          if (res.data.newName) {
            return res.data.newName;
          }
          return null;
        });

        // รออัปโหลดไฟล์ทั้งหมด
        const results = await Promise.all(uploadPromises);
        uploadedImages.push(...results.filter((name) => name !== null));
      }

      product.cost = parseInt(product.cost);
      product.price = parseInt(product.price);
      product.status = product.status || "use"; // กำหนดค่าเริ่มต้นเป็น "use" ถ้าไม่มีค่า

      let res;

      if (product.id === undefined) {
        res = await axios.post(
          config.apiPath + "/product/create",
          { ...product, images: uploadedImages },
          config.headers()
        );
      } else {
        res = await axios.put(
          config.apiPath + "/product/update",
          { ...product, images: uploadedImages },
          config.headers()
        );
      }

      if (res.data.message === "success") {
        Swal.fire({
          title: "save",
          text: "success",
          icon: "success",
          timer: 500,
        });
        document.getElementById("modalProduct_btnClose").click();
        fetchData();
        clearForm();

        setProduct({ ...product, id: undefined });
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/product/list",
        config.headers()
      );

      if (res.data.results !== undefined) {
        setProducts(
          res.data.results.map((product) => ({
            ...product,
            images: product.images || [], // เพิ่ม images ใน response
            status: product.status || "use", // เพิ่ม status ให้แสดงผล
          }))
        );
      }
    } catch (e) {
      Swal.fire({
        title: "error",
        text: e.message,
        icon: "error",
      });
    }
  };

  const clearForm = () => {
    setProduct({
      name: "",
      detail: "",
      cost: "",
      price: "",
      deposit: "",
      categoryId: "",
    });
    setImg(null);
    setImgs([]); // เคลียร์ state ของไฟล์
    imgPreviews.forEach((url) => URL.revokeObjectURL(url));
    setImgPreviews([]);
    refImg.current.value = ""; // รีเซ็ตค่า input file
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
          config.apiPath + "/product/remove/" + item.id,
          config.headers()
        );

        if (res.data.message === "success") {
          Swal.fire({
            title: "remove",
            text: "remove success",
            icon: "success",
            timer: 1000,
          });

          fetchData();
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

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/categories",
        config.headers()
      );
      if (res.data) {
        const activeCategories = res.data.filter(
          (category) => category.status === "active"
        ); // กรองเฉพาะที่ active
        setCategories(activeCategories);
      }
    } catch (e) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: e.message,
        icon: "error",
      });
    }
  };

  function showImage(product) {
    if (product.images && product.images.length > 0) {
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {product.images.map((image, index) => (
            <img
              key={index}
              alt=""
              className="img-fluid"
              src={config.apiPath + "/uploads/" + image.url}
              style={{ width: "145px", height: "145px", borderRadius: "4px" }}
            />
          ))}
        </div>
      );
    }

    return <></>;
  }

  function showSingleImage(product) {
    if (product.images && product.images.length > 0) {
      // แสดงเฉพาะภาพแรก
      const image = product.images[0];
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%", // ปรับตามขนาดที่ต้องการให้ครอบคลุม
          }}
        >
          <img
            alt=""
            className="img-fluid"
            src={config.apiPath + "/uploads/" + image.url}
            style={{
              width: "125px",
              height: "125px",
              borderRadius: "4px",
            }}
          />
        </div>
      );
    }

    return <></>;
  }

  const selectedFile = (inputFile) => {
    if (inputFile !== undefined) {
      if (inputFile.length > 0) {
        setImg(inputFile[0]);
      }
    }
  };

  const selectedFiles = (inputFiles) => {
    if (inputFiles && inputFiles.length > 0) {
      setImgs(Array.from(inputFiles));

      // สร้าง preview URLs
      const previewUrls = Array.from(inputFiles).map((file) =>
        URL.createObjectURL(file)
      );
      setImgPreviews(previewUrls);
    }
  };

  const selectedFileExcel = (fileInput) => {
    if (fileInput !== undefined) {
      if (fileInput.length > 0) {
        setFileExcel(fileInput[0]);
      }
    }
  };

  const handleUploadExcel = async () => {
    try {
      const formData = new FormData();
      formData.append("fileExcel", fileExcel);

      const res = await axios.post(
        `${config.apiPath}/product/uploadFromExcel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: localStorage.getItem("token"),
          },
        }
      );

      if (res.data.message === "อัปโหลดและประมวลผลไฟล์สำเร็จ") {
        Swal.fire({
          title: "สำเร็จ",
          text: "ไฟล์ของคุณถูกอัปโหลดเรียบร้อยแล้ว",
          icon: "success",
          timer: 1500,
        });

        fetchData();
        document.getElementById("modalExcel_btnClose").click();
      }
    } catch (e) {
      const errorMessage =
        e.response?.data?.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";

      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: errorMessage,
        icon: "error",
      });
    }
  };

  const clearFormExcel = () => {
    refExcel.current.value = "";
    setFileExcel(null);
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString().includes(searchTerm); // เพิ่มการค้นหา ID
    const matchesCategory = selectedCategory
      ? item.categoryId === parseInt(selectedCategory)
      : true;
    const matchesStatus = selectedStatus
      ? item.status === selectedStatus
      : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const displayStatusText = (item) => {
    const baseClass =
      "badge text-white px-3 py-2 shadow-sm d-flex align-items-center justify-content-center";

    switch (item.status) {
      case "use":
        return <div className={`${baseClass} bg-success`}>พร้อมเช่า</div>;
      case "reserved":
        return <div className={`${baseClass} bg-info`}>สินค้าติดเช่า</div>;
      case "delete":
        return <div className={`${baseClass} bg-danger`}>ไม่มีสินค้า</div>;
      default:
        return <div className={`${baseClass} bg-secondary`}>ไม่มีสถานะ</div>;
    }
  };

  return (
    <BackOffice>
      <div className="card">
        <div className="card-header">
          <h4 className="mb-3" style={{ fontSize: "20px", fontWeight: "bold" }}>
            สินค้า
          </h4>
          <div className="d-flex flex-wrap">
            <button
              onClick={clearForm}
              className="btn btn-primary mr-2 mb-2"
              data-toggle="modal"
              data-target="#modalProduct"
            >
              <i className="fa fa-plus mr-2"></i>เพิ่มสินค้า
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
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="ค้นหา ( ไอดี ชื่อสินค้า หรือรายละเอียด )"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <select
                className="form-control"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">-- หมวดหมู่สินค้า --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <select
                className="form-control"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">-- สถานะสินค้า --</option>
                <option value="use">พร้อมเช่า</option>
                <option value="reserved">สินค้าติดเช่า</option>
                <option value="delete">ลบสินค้า</option>
              </select>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th width="150px" className="text-center">
                    ภาพสินค้า
                  </th>
                  <th>ชื่อ</th>
                  <th>รายละเอียด</th>
                  <th className="text-center">หมวดหมู่</th>
                  <th width="120px" className="text-right">
                    ราคาสินค้า
                  </th>
                  <th width="100px" className="text-center">
                    สถานะ
                  </th>
                  <th width="115px" className="text-center">
                    แก้ไข / ลบ
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((item) => {
                    const category =
                      categories.find((cat) => cat.id === item.categoryId) ||
                      {};
                    return (
                      <tr key={item.id}>
                        <td className="text-center">
                          <div
                            style={{
                              border: "2px solid #4CAF50", // กรอบสีเขียว
                              padding: "1px 5px", // เว้นระยะภายใน
                              display: "inline-block", // ให้กรอบพอดีกับข้อความ
                              borderRadius: "8px", // มุมกรอบโค้งมน
                              backgroundColor: "#f9f9f9", // พื้นหลังสีอ่อน
                              marginBottom: "10px", // เพิ่มระยะห่างจากรูปภาพด้านล่าง
                            }}
                          >
                            ไอดี : {item.id}
                          </div>
                          <br />
                          {showSingleImage(item)}
                        </td>
                        <td>{item.name}</td>
                        <td>{item.detail}</td>
                        <td className="text-center">
                          {category.name || "No category"}
                        </td>
                        <td className="text-right">
                          ราคาเช่า : {item.price.toLocaleString("th-TH")}
                          <br />
                          <br />
                          ราคาทุน : {item.cost.toLocaleString("th-TH")}
                          <br />
                          <br />
                          ค่ามัดจำ : {item.deposit.toLocaleString("th-TH")}
                        </td>
                        <td>{displayStatusText(item)}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-primary mr-2"
                            data-toggle="modal"
                            data-target="#modalProduct"
                            onClick={(e) => setProduct(item)}
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MyModal id="modalProduct" title="ข้อมูลสินค้า">
        <div>
          <div>ชื่อสินค้า</div>
          <input
            value={product.name}
            className="form-control"
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <div>รายละเอียดสินค้า</div>
          <textarea
            value={product.detail}
            rows="4"
            className="form-control"
            onChange={(e) => setProduct({ ...product, detail: e.target.value })}
            style={{ resize: "vertical" }}
          ></textarea>
        </div>
        <div className="mt-3">
          <div>หมวดหมู่สินค้า</div>
          <select
            value={product.categoryId || ""}
            className="form-control"
            onChange={(e) =>
              setProduct({ ...product, categoryId: parseInt(e.target.value) })
            }
          >
            <option value="">-- เลือกหมวดหมู่สินค้า --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3">
          <div>สถานะสินค้า</div>
          <select
            value={product.status || ""}
            className="form-control"
            onChange={(e) => setProduct({ ...product, status: e.target.value })}
          >
            <option value="use">พร้อมเช่า</option>
            <option value="reserved">สินค้าติดเช่า</option>
            <option value="delete">ไม่มีสินค้า</option>
          </select>
        </div>

        <div className="mt-3">
          <div>ราคาทุน</div>
          <input
            value={product.cost}
            className="form-control"
            onChange={(e) => setProduct({ ...product, cost: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <div>ราคาเช่า</div>
          <input
            value={product.price}
            className="form-control"
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <div>ค่ามัดจำ</div>
          <input
            value={product.deposit}
            className="form-control"
            onChange={(e) =>
              setProduct({ ...product, deposit: e.target.value })
            }
          />
        </div>
        <div className="mt-3">
          <div className="mb-3">
            <h6>รูปภาพเดิม</h6>
            {/* แสดงรูปภาพเดิม (ถ้ามี) */}
            {showImage(product)}
          </div>
          {/* แสดง preview รูปภาพใหม่ที่เลือก */}
          {imgPreviews.length > 0 && (
            <div className="mb-3">
              <h6>รูปภาพใหม่</h6>
              <div className="d-flex flex-wrap gap-2 mt-3">
                {imgPreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="position-relative"
                    style={{ marginRight: "10px", marginBottom: "10px" }}
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: "140px",
                        height: "140px",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>อัพโหลด รูปสินค้า</div>
          <input
            className="form-control"
            type="file"
            ref={refImg}
            multiple
            accept="image/*"
            onChange={(e) => selectedFiles(e.target.files)}
          />
        </div>
        <div className="mt-3">
          <button className="btn btn-primary" onClick={handleSave}>
            <i className="fa fa-check mr-2"></i>บันทึก
          </button>
        </div>
      </MyModal>

      <MyModal id="modalExcel" title="เลือกไฟล์">
        <div>เลือกไฟล์</div>
        <input
          className="form-control"
          type="file"
          ref={refExcel}
          onChange={(e) => selectedFileExcel(e.target.files)}
        />

        <button className="mt-3 btn btn-primary" onClick={handleUploadExcel}>
          <i className="fa fa-upload mr-2"></i>อัพโหลด
        </button>
      </MyModal>
    </BackOffice>
  );
}

export default Product;
