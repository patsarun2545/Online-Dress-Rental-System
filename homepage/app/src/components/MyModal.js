function MyModal(props) {
    return <>
        <div className="modal" tabindex="-1" id={props.id}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{props.title}</h5>
                        <button id={props.id + '_btnClose'} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close">
                        </button>
                    </div>
                    <div className="modal-body">
                        {props.children}
                    </div>
                </div>
            </div>
        </div>
    </>
}

export default MyModal;