import BackOffice from "../components/BackOffice";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../config";
import "./Home.css";
import { useLocation, Link } from "react-router-dom";

function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [heart, setHeart] = useState([]);
  const location = useLocation();
  const [sortOption, setSortOption] = useState("latest"); // ตัวเลือกการเรียง
  const [currentPage, setCurrentPage] = useState(1); // หน้าปัจจุบัน
  const productsPerPage = 15; // จำนวนสินค้าต่อหน้า
  const [otherProducts, setOtherProducts] = useState([]);

  useEffect(() => {
    fetchData();
    loadCartFromLocalStorage();
    loadHeartFromLocalStorage();
  }, [location, sortOption, currentPage]);

  const fetchData = async () => {
    const queryParams = new URLSearchParams(location.search);
    const categoryId = queryParams.get("category");
    const searchTerm = queryParams.get("search");

    try {
      const res = await axios.get(config.apiPath + "/product/list", {
        params: {
          categoryId: categoryId || undefined,
          search: searchTerm || undefined,
          sort: sortOption,
        },
      });

      // Filter the products to only include those with status "use"
      const filteredProducts = res.data.results.filter(
        (product) => product.status === "use"
      );
      const nonUseProducts = res.data.results.filter(
        (product) => product.status !== "use"
      );

      setProducts(filteredProducts);
      setOtherProducts(nonUseProducts);
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: "เกิดข้อผิดพลาดไม่สามารถดึงข้อมูลสินค้าได้",
        icon: "error",
      });
    }
  };

  const loadCartFromLocalStorage = () => {
    const savedCart = JSON.parse(localStorage.getItem("carts")) || [];
    setCart(savedCart);
  };

  const loadHeartFromLocalStorage = () => {
    const savedHeart = JSON.parse(localStorage.getItem("heart")) || [];
    setHeart(savedHeart);
  };

  const addToCart = (item) => {
    const savedCart = JSON.parse(localStorage.getItem("carts")) || [];
    const isAlreadyInCart = savedCart.some(
      (cartItem) => cartItem.id === item.id
    );

    if (isAlreadyInCart) {
      Swal.fire({
        title: "เตือน!",
        text: "สินค้านี้อยู่ในตะกร้าแล้ว!",
        icon: "warning",
        timer: 500,
        showConfirmButton: false,
      });
      return;
    }

    const updatedCart = [...savedCart, item];
    setCart(updatedCart);
    localStorage.setItem("carts", JSON.stringify(updatedCart));

    Swal.fire({
      title: "สำเร็จ!",
      text: "หยิบสินค้าเรียบร้อยแล้ว!",
      icon: "success",
      timer: 500,
      showConfirmButton: false,
    });
  };

  const addToHeart = (item) => {
    const isAlreadyInHeart = heart.some(
      (heartItem) => heartItem.id === item.id
    );
    if (isAlreadyInHeart) {
      Swal.fire({
        title: "เตือน!",
        text: "สินค้านี้ถูกใจแล้ว!",
        icon: "warning",
        timer: 500,
        showConfirmButton: false,
      });
      return;
    }

    const updatedHeart = [...heart, item];
    setHeart(updatedHeart);
    localStorage.setItem("heart", JSON.stringify(updatedHeart));

    Swal.fire({
      title: "สำเร็จ!",
      text: "ถูกใจสินค้าเรียบร้อยแล้ว!",
      icon: "success",
      timer: 500,
      showConfirmButton: false,
    });
  };

  const showImage = (item) => {
    if (item.images && item.images.length > 0) {
      // Retrieve the first image URL
      let imgPath = config.apiPath + "/uploads/" + item.images[0].url;

      // Check for empty URL fallback
      if (item.images[0].url === "") imgPath = "default_image.jpg";
      return (
        <img
          className="card-img-top"
          height="200px"
          src={imgPath}
          alt={item.name || "Product Image"}
        />
      );
    }
    return (
      <img
        className="card-img-top"
        height="200px"
        src="default_image.jpg"
        alt="Default Image"
      />
    );
  };

  const displayStatusText = (item) => {
    const baseClass =
      "badge text-white px-3 py-3 shadow-sm d-flex align-items-center justify-content-center gap-2";

    switch (item.status) {
      case "reserved":
        return (
          <div className={`${baseClass} bg-secondary`}>
            <i className="fa fa-clock"></i>
            <span>สินค้าติดเช่า</span>
          </div>
        );
      case "delete":
        return (
          <div className={`${baseClass} bg-danger`}>
            <i className="fa fa-ban"></i>
            <span>ไม่มีสินค้า</span>
          </div>
        );
      default:
        return (
          <div className={`${baseClass} bg-secondary`}>
            <i className="fa fa-question-circle"></i>
            <span>ไม่มีสถานะ</span>
          </div>
        );
    }
  };

  // คำนวณสินค้าในหน้าปัจจุบัน
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const totalPages = Math.ceil(products.length / productsPerPage);

  return (
    <BackOffice>
      <div className="container mt-5">
        <div className="mb-3 d-flex justify-content-start">
          <select
            className="form-select w-auto"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="latest">สินค้าล่าสุด</option>
            <option value="price_low_to_high">ราคาต่ำไปสูง</option>
            <option value="price_high_to_low">ราคาสูงไปต่ำ</option>
          </select>
        </div>
        <div className="row g-0">
          {currentProducts.length > 0 ? (
            currentProducts.map((item) => (
              <div
                className="col-xxl-2 col-lg-3 col-md-4 col-sm-6"
                key={item.id}
              >
                <Link
                  to={`/product/${item.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="card h-100 border-0 shadow-sm position-relative">
                    <i
                      className="fa fa-heart position-absolute text-danger"
                      style={{ top: "10px", right: "10px", cursor: "pointer" }}
                      onClick={(e) => {
                        e.preventDefault();
                        addToHeart(item);
                      }}
                    ></i>
                    {showImage(item)}
                    <div className="card-body d-flex flex-column justify-content-between">
                      <div className="text-center mb-3">
                        <h6 className="card-title mb-1">{item.name}</h6>
                        <p className="text-muted mb-0">
                          ฿{item.price.toLocaleString("th-TH")}
                        </p>
                      </div>
                      <div className="text-center">
                        <button
                          className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart(item);
                          }}
                        >
                          <i className="fa fa-shopping-cart me-2"></i>หยิบสินค้า
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center text-muted">ไม่มีสินค้า</div>
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container mt-4">
            <button
              className={`pagination-btn ${
                currentPage === 1 ? "disabled" : ""
              }`}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
            >
              ก่อนหน้า
            </button>
            {Array.from({ length: totalPages }, (_, index) => {
              if (
                index + 1 === 1 || // หน้าแรก
                index + 1 === totalPages || // หน้าสุดท้าย
                (index + 1 >= currentPage - 1 && index + 1 <= currentPage + 1) // ช่วงรอบหน้าปัจจุบัน
              ) {
                return (
                  <button
                    key={index}
                    className={`pagination-btn ${
                      currentPage === index + 1 ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                );
              } else if (
                index + 1 === currentPage - 2 || // จุดก่อนช่วงรอบหน้าปัจจุบัน
                index + 1 === currentPage + 2 // จุดหลังช่วงรอบหน้าปัจจุบัน
              ) {
                return (
                  <span key={index} className="pagination-ellipsis">
                    ...
                  </span>
                );
              }
              return null; // ไม่แสดงหน้าอื่นๆ ที่ไม่เกี่ยวข้อง
            })}
            <button
              className={`pagination-btn ${
                currentPage === totalPages ? "disabled" : ""
              }`}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages}
            >
              ถัดไป
            </button>
          </div>
        )}
        {otherProducts.length > 0 && (
          <div className="mt-5">
            <div className="row g-0">
              {otherProducts.map((item) => (
                <div
                  className="col-xxl-2 col-lg-3 col-md-4 col-sm-6"
                  key={item.id}
                >
                  <Link
                    to={`/product/${item.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="card h-100 border-0 shadow-sm position-relative">
                      {showImage(item)}
                      <div className="card-body d-flex flex-column justify-content-between">
                        <div className="text-center mb-3">
                          <h5>{displayStatusText(item)}</h5>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BackOffice>
  );
}

export default Home;
