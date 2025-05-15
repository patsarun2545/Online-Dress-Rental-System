import Navbar from './Navbar';


function BackOffice(props){

    return <>
        <div className="wrapper">
            <Navbar/>

            <div className="content-wrapper p-2">
                {props.children}
            </div>

        </div>
    </>
}

export default BackOffice;