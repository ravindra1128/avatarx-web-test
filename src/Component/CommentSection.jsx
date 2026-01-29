import { useContext, useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Edit } from "lucide-react";
import moment from "moment";
import { toast } from "react-toastify";
import apiClient from "../config/APIConfig";
import { AuthContext } from "./AuthProvider";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./UI/tooltip";
import { useTranslation } from "react-i18next";
import { logCritical } from "../utils/logger";

export function CommentSection({ isNote, patientId, comments = [], onCommentAdded, currentUser, globalEditing, setGlobalEditing, userId }) {
    const [showAllComments, setShowAllComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isSavingComment, setIsSavingComment] = useState(false);
    const [editingContent, setEditingContent] = useState(""); // Track the content being edited
    const [isSavingEdit, setIsSavingEdit] = useState(false); // Track edit saving state
    const {authData} = useContext(AuthContext);
    const {t} = useTranslation();
        // Add new comment
    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setIsSavingComment(true);
        try {
            const payload = {
                user_id: patientId,
                content: newComment.trim(),
            }
            let apiUrl = isNote ? "/user/create_patient_notes" : "/user/create_patient_comment";
            const response = await apiClient.post(apiUrl, payload);
            setNewComment("");
            setGlobalEditing({ userId: null, commentId: null }); // Close add input
            toast.success(t("users.commentAddedSuccessfully"));
            if (onCommentAdded) {
                onCommentAdded(response.data.data);
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            logCritical("Error adding comment:", error);
            toast.error(t("users.errorAddingComment"));
        } finally {
            setIsSavingComment(false);
        }
    };

    const handleSubmitComment = () => {
        if (newComment.trim()) {
            handleAddComment();
        }
    };

    const handleInputFocus = () => {
        setGlobalEditing({ userId: patientId, commentId: 'add' });
    };

    const handleInputBlur = () => {
        if (!newComment.trim()) {
            if (globalEditing && globalEditing.userId === patientId && globalEditing.commentId === 'add') {
                setGlobalEditing({ userId: null, commentId: null });
            }
        }
    };

    const handleCancel = () => {
        setNewComment("");
        if (globalEditing && globalEditing.userId === patientId && globalEditing.commentId === 'add') {
            setGlobalEditing({ userId: null, commentId: null });
        }
    };

    // Edit comment
    const handleEditComment = (comment) => {
        setGlobalEditing({ userId: patientId, commentId: comment.comment_id || comment.id });
        setEditingContent(comment.content);
    };

    const handleCancelEdit = () => {
        setGlobalEditing({ userId: null, commentId: null });
        setEditingContent("");
    };

    const handleSaveEdit = async (comment) => {
        if (!editingContent.trim()) return;
        setIsSavingEdit(true);
        try {
            const payload = {
                comment_id: comment.comment_id || comment.id,
                content: editingContent.trim(),
            };
            let apiUrl = isNote ? "/user/update_patient_notes" : "/user/update_patient_comment"; 
            const response = await apiClient.post(apiUrl, payload);
            toast.success(t("users.commentUpdatedSuccessfully"));
            setGlobalEditing({ userId: null, commentId: null });
            setEditingContent("");
            if (onCommentAdded) {
                onCommentAdded(response.data.data, "update");
            }
        } catch (error) {
            console.error("Error updating comment:", error);
            logCritical("Error updating comment:", error);
            toast.error(t("users.errorUpdatingComment"));
        } finally {
            setIsSavingEdit(false);
        }
    };

    const visibleComments = comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const hasMoreComments = comments.length > 1;

    // Helper to get initials
    const getInitials = (first, last) => {
        const f = first ? first[0] : '';
        const l = last ? last[0] : '';
        return (f + l).toUpperCase();
    };

    // Only show add input as active if this is the open input
    const isAddInputActive = globalEditing && globalEditing.userId === patientId && globalEditing.commentId === 'add';

    const editInputRef = useRef(null);

    // Close edit input on outside click
    useEffect(() => {
        // Find if any edit is open for this comment section
        const uniqueEditId = globalEditing && globalEditing.userId === patientId ? globalEditing.commentId : null;
        if (!uniqueEditId || uniqueEditId === 'add') return;
        function handleClickOutside(event) {
            if (editInputRef.current && !editInputRef.current.contains(event.target)) {
                handleCancelEdit();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [globalEditing, patientId]);

    return (
        <div className="space-y-2">
            {/* Existing Comments */}
            <div
                className={` ${showAllComments ? 'space-y-2' : 'space-y-0'} transition-all duration-500 ease-in-out overflow-hidden`}
                style={{
                    maxHeight: showAllComments ? `${Math.max(comments.length * 80, 160)}px` : '90px',
                }}
            >
                <TooltipProvider>
                {visibleComments.map((comment, idx) => {
                    const uniqueId = comment.comment_id || comment.id || idx;
                    const contentSafe = comment.content || '';
                    const maxLen = 32;
                    const isLong = contentSafe.length > maxLen;
                    const displayText = isLong ? contentSafe.slice(0, maxLen) + "..." : contentSafe;
                    const isVisible = showAllComments || idx === 0;
                    const isEditing = globalEditing && globalEditing.userId === patientId && globalEditing.commentId === uniqueId;
                    const isOwnComment = (authData?.user?.id && (comment.comment_provider_id === authData.user.id));
                    return (
                        <div
                            key={uniqueId}
                            className={`flex items-start space-x-2 transition-all duration-500 ease-in-out ${isVisible ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 pointer-events-none'} overflow-hidden`}
                            style={{
                                transitionProperty: 'opacity, max-height',
                            }}
                        >
                            <div className={`w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
                                {getInitials(comment.provider_first_name, comment.provider_last_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-medium text-black">{`${comment.provider_first_name || ''} ${comment.provider_last_name || ''}`.trim()}</span>
                                    <span className="text-xs text-gray-500">
                                        {moment(comment.created_at).fromNow()}
                                    </span>
                                    {/* Edit button for own comments */}
                                    {isOwnComment && !isEditing && (
                                        <button
                                            className="text-xs text-blue-500 hover:underline ml-2 flex items-center"
                                            onClick={() => {
                                                setGlobalEditing({ userId: patientId, commentId: uniqueId });
                                                setEditingContent(comment.content);
                                            }}
                                            title={t("users.edit")}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                        </button>
                                    )}
                                </div>
                                <div className="text-sm text-gray-800 mt-0.5">
                                    {isEditing ? (
                                        <div className="flex flex-col space-y-2" ref={editInputRef}>
                                            <input
                                                type="text"
                                                value={editingContent}
                                                onChange={e => setEditingContent(e.target.value)}
                                                className="w-full text-sm text-black placeholder-gray-500 bg-transparent border-0 border-b focus:outline-none py-1 px-0 border-b-2 border-black"
                                                disabled={isSavingEdit}
                                            />
                                            <div className="flex space-x-2 mt-1 justify-end">
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1"
                                                    disabled={isSavingEdit}
                                                >
                                                    {t("users.cancel")}
                                                </button>
                                                <button
                                                    onClick={() => handleSaveEdit(comment)}
                                                    disabled={!editingContent.trim() || isSavingEdit}
                                                    className="text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSavingEdit ? t("users.saving") : t("users.save")}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        isLong ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-pointer">{displayText}</span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    {contentSafe}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <span>{contentSafe}</span>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                </TooltipProvider>
            </div>

            {/* View All Comments Toggle */}
            {hasMoreComments && (
                <button
                    onClick={() => setShowAllComments(!showAllComments)}
                    className="text-xs text-[#3d7deb] hover:text-blue-700 font-medium flex items-center cursor-pointer"
                >
                    {showAllComments ? (
                        <>
                            <ChevronUp className="w-3 h-3 mr-1" />
                            {t("users.showFewerComments")}
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-3 h-3 mr-1" />
                            {t("users.showMoreComments")}
                        </>
                    )}
                </button>
            )}

            {/* Comment Input */}
            <div className="mt-3">
                <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {getInitials(authData?.user?.first_name, authData?.user?.last_name)}
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder={isNote ? "Add a note..." : "Add a comment..."}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitComment();
                                }
                            }}
                            className={`w-full text-sm text-black placeholder-gray-500 bg-transparent border-0 border-b focus:outline-none py-1 px-0 transition-colors duration-200 ${isAddInputActive ? 'border-b-2 border-black' : 'border-gray-200'}`}
                            disabled={isSavingComment}
                        />

                        {/* Comment Actions */}
                        {isAddInputActive && (
                            <div className="mt-2 flex items-center justify-end space-x-2">
                                <button
                                    onClick={handleCancel}
                                    className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1"
                                    disabled={isSavingComment}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={!newComment.trim() || isSavingComment}
                                    className="text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingComment ? "Adding..." :  isNote ? "Note" : "Comment"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
