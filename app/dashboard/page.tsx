"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import {
  IconLogout,
  IconTrash,
  IconFilter,
  IconSortDescending,
  IconEye,
  IconEyeOff,
  IconSearch,
  IconDownload,
  IconTrashX,
  IconLayoutGrid,
  IconLayoutList,
  IconFileSpreadsheet,
  IconSelectAll,
  IconSelect,
  IconSquare,
  IconSquareCheck,
  IconRefresh,
} from "@tabler/icons-react";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "react-toastify/dist/ReactToastify.css";
import "./dashboard.css";

interface Submission {
  id: string;
  template_id: string;
  template_name: string;
  image_url: string | null;
  created_at: string;
  status: string;
  removed_at: string | null;
  metadata?: any;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>(
    []
  );
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("all");
  const [showRemoved, setShowRemoved] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch submissions
  useEffect(() => {
    if (user) {
      fetchSubmissions();

      // Subscribe to real-time updates
      const subscription = supabase
        .channel("submissions_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "submissions",
          },
          () => {
            fetchSubmissions();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  // Filter and search
  useEffect(() => {
    let result = [...submissions];

    // Filter by status
    if (!showRemoved) {
      result = result.filter((sub) => sub.status === "active");
    }

    // Filter by template
    if (filterTemplate !== "all") {
      result = result.filter((sub) => sub.template_id === filterTemplate);
    }

    // Search by ID or template name
    if (searchTerm) {
      result = result.filter(
        (sub) =>
          sub.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.template_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredSubmissions(result);
  }, [submissions, searchTerm, filterTemplate, showRemoved, sortOrder]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchTerm, filterTemplate, showRemoved]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/dashboard/login");
      return;
    }

    setUser(session.user);
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFloat = async (submission: Submission) => {
    if (!submission.image_url) {
      toast.error("This float has already been removed");
      return;
    }

    const confirmed = window.confirm(
      `Remove this ${submission.template_name} float?\n\nThis will remove it from the parade display immediately.`
    );

    if (!confirmed) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Session expired. Please login again.");
        router.push("/dashboard/login");
        return;
      }

      const response = await fetch(
        `/api/submissions/${submission.id}/moderate`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to remove float");

      toast.success("Float removed successfully!");
      fetchSubmissions();
    } catch (error) {
      console.error("Error removing float:", error);
      toast.error("Failed to remove float");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/dashboard/login");
  };

  // Permanently delete a submission from database
  const handlePermanentDelete = async (submission: Submission) => {
    const confirmed = window.confirm(
      `⚠️ PERMANENTLY DELETE this ${submission.template_name}?\n\nThis will remove the record from the database entirely. This action cannot be undone!`
    );

    if (!confirmed) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Session expired. Please login again.");
        router.push("/dashboard/login");
        return;
      }

      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Permanently deleted!");
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(submission.id);
        return newSet;
      });
      fetchSubmissions();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  // Restore a removed submission back to active
  const handleRestore = async (submission: Submission) => {
    if (submission.status !== "removed") {
      toast.error("This submission is already active");
      return;
    }

    if (!submission.image_url) {
      toast.error("Cannot restore - image was permanently deleted");
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Session expired. Please login again.");
        router.push("/dashboard/login");
        return;
      }

      const response = await fetch(
        `/api/submissions/${submission.id}/moderate`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to restore");

      toast.success("Float restored to parade!");
      fetchSubmissions();
    } catch (error) {
      console.error("Error restoring:", error);
      toast.error("Failed to restore");
    }
  };

  // Restore selected removed submissions
  const handleRestoreSelected = async () => {
    const selectedRemoved = getSelectedSubmissions().filter(
      (s) => s.status === "removed" && s.image_url
    );

    if (selectedRemoved.length === 0) {
      toast.info("No restorable submissions selected");
      return;
    }

    const confirmed = window.confirm(
      `Restore ${selectedRemoved.length} float(s) to the parade?`
    );

    if (!confirmed) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Session expired. Please login again.");
        router.push("/dashboard/login");
        return;
      }

      let restoredCount = 0;
      const toastId = toast.loading(`Restoring 0/${selectedRemoved.length}...`);

      for (let i = 0; i < selectedRemoved.length; i++) {
        const submission = selectedRemoved[i];
        try {
          toast.update(toastId, {
            render: `Restoring ${i + 1}/${selectedRemoved.length}...`,
          });

          const response = await fetch(
            `/api/submissions/${submission.id}/moderate`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) restoredCount++;
        } catch (err) {
          console.error("Failed to restore:", submission.id, err);
        }
      }

      toast.update(toastId, {
        render: `Restored ${restoredCount} float(s) to parade`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setSelectedIds(new Set());
      fetchSubmissions();
    } catch (error) {
      console.error("Error restoring selected:", error);
      toast.error("Failed to restore selected");
    }
  };

  // Purge all removed submissions
  const handlePurgeAllRemoved = async () => {
    const removedCount = submissions.filter(
      (s) => s.status === "removed"
    ).length;

    if (removedCount === 0) {
      toast.info("No removed submissions to purge");
      return;
    }

    const confirmed = window.confirm(
      `⚠️ PERMANENTLY DELETE ${removedCount} removed submission(s)?\n\nThis will free up database space but cannot be undone!`
    );

    if (!confirmed) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Session expired. Please login again.");
        router.push("/dashboard/login");
        return;
      }

      const removedSubmissions = submissions.filter(
        (s) => s.status === "removed"
      );
      let deletedCount = 0;

      for (const submission of removedSubmissions) {
        try {
          const response = await fetch(`/api/submissions/${submission.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) deletedCount++;
        } catch (err) {
          console.error("Failed to delete:", submission.id, err);
        }
      }

      toast.success(`Purged ${deletedCount} submissions`);
      setSelectedIds(new Set());
      fetchSubmissions();
    } catch (error) {
      console.error("Error purging:", error);
      toast.error("Failed to purge submissions");
    }
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const allIds = filteredSubmissions
      .filter((s) => s.image_url) // Only select items with images
      .map((s) => s.id);
    setSelectedIds(new Set(allIds));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const getSelectedSubmissions = () => {
    return filteredSubmissions.filter((s) => selectedIds.has(s.id));
  };

  // Remove selected submissions from parade (soft delete)
  const handleRemoveSelected = async () => {
    const selectedActive = getSelectedSubmissions().filter(
      (s) => s.status === "active" && s.image_url
    );

    if (selectedActive.length === 0) {
      toast.info("No active submissions selected to remove");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${selectedActive.length} float(s) from the parade?\n\nThis will hide them from the parade display immediately.`
    );

    if (!confirmed) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Session expired. Please login again.");
        router.push("/dashboard/login");
        return;
      }

      let removedCount = 0;
      const toastId = toast.loading(`Removing 0/${selectedActive.length}...`);

      for (let i = 0; i < selectedActive.length; i++) {
        const submission = selectedActive[i];
        try {
          toast.update(toastId, {
            render: `Removing ${i + 1}/${selectedActive.length}...`,
          });

          const response = await fetch(
            `/api/submissions/${submission.id}/moderate`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) removedCount++;
        } catch (err) {
          console.error("Failed to remove:", submission.id, err);
        }
      }

      toast.update(toastId, {
        render: `Removed ${removedCount} float(s) from parade`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setSelectedIds(new Set());
      fetchSubmissions();
    } catch (error) {
      console.error("Error removing selected:", error);
      toast.error("Failed to remove selected");
    }
  };

  // Generate Excel data from submissions
  const generateExcelData = (subs: Submission[]) => {
    return subs.map((sub, index) => ({
      "No.": index + 1,
      ID: sub.id,
      "Template ID": sub.template_id,
      "Template Name": sub.template_name,
      Status: sub.status,
      "Created At": formatDate(sub.created_at),
      "Removed At": sub.removed_at ? formatDate(sub.removed_at) : "",
      "Image URL": sub.image_url || "",
      "Has Image": sub.image_url ? "Yes" : "No",
    }));
  };

  // Download ZIP with images and Excel summary
  const handleDownloadZip = async (downloadAll: boolean = true) => {
    const subsToDownload = downloadAll
      ? filteredSubmissions.filter((s) => s.image_url)
      : getSelectedSubmissions().filter((s) => s.image_url);

    if (subsToDownload.length === 0) {
      toast.info("No images to download");
      return;
    }

    setDownloading(true);
    const toastId = toast.loading(
      `Preparing ${subsToDownload.length} images...`
    );

    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder("images");

      // Download and add images to ZIP
      let successCount = 0;
      for (let i = 0; i < subsToDownload.length; i++) {
        const submission = subsToDownload[i];
        try {
          toast.update(toastId, {
            render: `Downloading ${i + 1}/${subsToDownload.length}: ${
              submission.template_name
            }`,
          });

          const response = await fetch(submission.image_url!);
          const blob = await response.blob();
          const fileName = `${submission.template_name}_${submission.id}.png`;
          imagesFolder?.file(fileName, blob);
          successCount++;
        } catch (error) {
          console.error("Failed to download:", submission.id, error);
        }
      }

      // Generate Excel summary
      toast.update(toastId, { render: "Generating Excel summary..." });

      const excelData = generateExcelData(subsToDownload);
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 5 }, // No.
        { wch: 40 }, // ID
        { wch: 15 }, // Template ID
        { wch: 20 }, // Template Name
        { wch: 10 }, // Status
        { wch: 20 }, // Created At
        { wch: 20 }, // Removed At
        { wch: 60 }, // Image URL
        { wch: 10 }, // Has Image
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

      // Add summary sheet
      const summaryData = [
        { Metric: "Total Submissions", Value: subsToDownload.length },
        {
          Metric: "Active",
          Value: subsToDownload.filter((s) => s.status === "active").length,
        },
        {
          Metric: "Removed",
          Value: subsToDownload.filter((s) => s.status === "removed").length,
        },
        {
          Metric: "With Images",
          Value: subsToDownload.filter((s) => s.image_url).length,
        },
        { Metric: "Export Date", Value: new Date().toLocaleString() },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet["!cols"] = [{ wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Write Excel to buffer and add to ZIP
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      zip.file("submissions_summary.xlsx", excelBuffer);

      // Generate and download ZIP
      toast.update(toastId, { render: "Creating ZIP file..." });

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const timestamp = new Date().toISOString().split("T")[0];
      saveAs(zipBlob, `chingay_submissions_${timestamp}.zip`);

      toast.update(toastId, {
        render: `Downloaded ${successCount} images + Excel summary`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.update(toastId, {
        render: "Failed to create download",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setDownloading(false);
    }
  };

  // Export Excel only (no images)
  const handleExportExcel = () => {
    const excelData = generateExcelData(filteredSubmissions);
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 40 },
      { wch: 15 },
      { wch: 20 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 60 },
      { wch: 10 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    const timestamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `chingay_submissions_${timestamp}.xlsx`);

    toast.success("Excel exported!");
  };

  const getUniqueTemplates = () => {
    const templates = new Set(submissions.map((sub) => sub.template_id));
    return Array.from(templates);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const selectedCount = selectedIds.size;
  const selectableCount = filteredSubmissions.filter((s) => s.image_url).length;

  return (
    <div className="dashboard-container">
      <ToastContainer position="top-right" />

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Moderation Dashboard</h1>
            <p>Manage parade float submissions</p>
          </div>
          <div className="header-right">
            <span className="user-email">{user?.email}</span>
            <button onClick={handleLogout} className="logout-button">
              <IconLogout size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value">{submissions.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active</span>
          <span className="stat-value">
            {submissions.filter((s) => s.status === "active").length}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Removed</span>
          <span className="stat-value">
            {submissions.filter((s) => s.status === "removed").length}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Showing</span>
          <span className="stat-value">{filteredSubmissions.length}</span>
        </div>
        {selectedCount > 0 && (
          <div className="stat-card selected">
            <span className="stat-label">Selected</span>
            <span className="stat-value">{selectedCount}</span>
          </div>
        )}
      </div>

      {/* Controls Row 1 - Filters */}
      <div className="controls-bar">
        <div className="search-box">
          <IconSearch size={20} />
          <input
            type="text"
            placeholder="Search by ID or template name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>
            <IconFilter size={18} />
            Template:
          </label>
          <select
            value={filterTemplate}
            onChange={(e) => setFilterTemplate(e.target.value)}
          >
            <option value="all">All Templates</option>
            {getUniqueTemplates().map((template) => (
              <option key={template} value={template}>
                {template.charAt(0).toUpperCase() + template.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>
            <IconSortDescending size={18} />
            Sort:
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <button
          className={`toggle-button ${showRemoved ? "active" : ""}`}
          onClick={() => setShowRemoved(!showRemoved)}
        >
          {showRemoved ? <IconEye size={18} /> : <IconEyeOff size={18} />}
          {showRemoved ? "Hide Removed" : "Show Removed"}
        </button>

        {/* View Toggle */}
        <div className="view-toggle">
          <button
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
            title="Grid View"
          >
            <IconLayoutGrid size={20} />
          </button>
          <button
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
            title="List View"
          >
            <IconLayoutList size={20} />
          </button>
        </div>
      </div>

      {/* Controls Row 2 - Actions */}
      <div className="controls-bar actions-bar">
        {/* Selection controls */}
        <div className="selection-controls">
          <button
            className="select-button"
            onClick={selectedCount === selectableCount ? selectNone : selectAll}
            disabled={selectableCount === 0}
          >
            {selectedCount === selectableCount && selectableCount > 0 ? (
              <>
                <IconSelect size={18} />
                Deselect All
              </>
            ) : (
              <>
                <IconSelectAll size={18} />
                Select All ({selectableCount})
              </>
            )}
          </button>
          {selectedCount > 0 && (
            <span className="selection-info">{selectedCount} selected</span>
          )}
        </div>

        {/* Download buttons */}
        <div className="download-buttons">
          <button
            className="action-button download-all"
            onClick={() => handleDownloadZip(true)}
            disabled={downloading || selectableCount === 0}
          >
            <IconDownload size={18} />
            Download All (ZIP)
          </button>

          {selectedCount > 0 && (
            <button
              className="action-button download-selected"
              onClick={() => handleDownloadZip(false)}
              disabled={downloading}
            >
              <IconDownload size={18} />
              Download Selected ({selectedCount})
            </button>
          )}

          <button
            className="action-button export-excel"
            onClick={handleExportExcel}
            disabled={filteredSubmissions.length === 0}
          >
            <IconFileSpreadsheet size={18} />
            Export Excel
          </button>

          {/* Remove selected button */}
          {selectedCount > 0 &&
            getSelectedSubmissions().filter(
              (s) => s.status === "active" && s.image_url
            ).length > 0 && (
              <button
                className="action-button remove-selected"
                onClick={handleRemoveSelected}
              >
                <IconTrash size={18} />
                Remove Selected (
                {
                  getSelectedSubmissions().filter(
                    (s) => s.status === "active" && s.image_url
                  ).length
                }
                )
              </button>
            )}

          {/* Restore selected button */}
          {selectedCount > 0 &&
            getSelectedSubmissions().filter(
              (s) => s.status === "removed" && s.image_url
            ).length > 0 && (
              <button
                className="action-button restore-selected"
                onClick={handleRestoreSelected}
              >
                <IconRefresh size={18} />
                Restore Selected (
                {
                  getSelectedSubmissions().filter(
                    (s) => s.status === "removed" && s.image_url
                  ).length
                }
                )
              </button>
            )}
        </div>

        {/* Purge button */}
        {showRemoved &&
          submissions.filter((s) => s.status === "removed").length > 0 && (
            <button
              className="action-button purge-button"
              onClick={handlePurgeAllRemoved}
            >
              <IconTrashX size={18} />
              Purge Removed (
              {submissions.filter((s) => s.status === "removed").length})
            </button>
          )}
      </div>

      {/* Submissions Grid/List View */}
      {viewMode === "grid" ? (
        <div className="submissions-grid">
          {filteredSubmissions.length === 0 ? (
            <div className="empty-state">
              <p>No submissions found</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`submission-card ${
                  submission.status === "removed" ? "removed" : ""
                } ${selectedIds.has(submission.id) ? "selected" : ""}`}
              >
                {/* Selection checkbox */}
                {submission.image_url && (
                  <button
                    className="select-checkbox"
                    onClick={() => toggleSelection(submission.id)}
                  >
                    {selectedIds.has(submission.id) ? (
                      <IconSquareCheck size={24} />
                    ) : (
                      <IconSquare size={24} />
                    )}
                  </button>
                )}

                <div className="submission-image">
                  {submission.image_url ? (
                    <img
                      src={submission.image_url}
                      alt={submission.template_name}
                    />
                  ) : (
                    <div className="image-removed">
                      <IconEyeOff size={48} />
                      <span>Image Removed</span>
                    </div>
                  )}
                </div>

                <div className="submission-info">
                  <h3>{submission.template_name}</h3>
                  <p className="submission-id">ID: {submission.id}</p>
                  <p className="submission-date">
                    {formatDate(submission.created_at)}
                  </p>

                  {submission.status === "removed" && submission.removed_at && (
                    <p className="removed-date">
                      Removed: {formatDate(submission.removed_at)}
                    </p>
                  )}

                  <div className="submission-actions">
                    {submission.status === "active" && submission.image_url && (
                      <button
                        onClick={() => handleRemoveFloat(submission)}
                        className="remove-button"
                      >
                        <IconTrash size={18} />
                        Remove
                      </button>
                    )}
                    {submission.status === "removed" &&
                      submission.image_url && (
                        <button
                          onClick={() => handleRestore(submission)}
                          className="restore-button"
                        >
                          <IconRefresh size={18} />
                          Restore
                        </button>
                      )}
                    {submission.status === "removed" && (
                      <button
                        onClick={() => handlePermanentDelete(submission)}
                        className="delete-button"
                      >
                        <IconTrashX size={18} />
                        Delete
                      </button>
                    )}
                    <span
                      className={`status-badge ${
                        submission.status === "active" ? "active" : "removed"
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* List View */
        <div className="submissions-list">
          {filteredSubmissions.length === 0 ? (
            <div className="empty-state">
              <p>No submissions found</p>
            </div>
          ) : (
            <>
              <div className="list-header">
                <div className="list-col col-select"></div>
                <div className="list-col col-image">Image</div>
                <div className="list-col col-template">Template</div>
                <div className="list-col col-id">ID</div>
                <div className="list-col col-date">Created</div>
                <div className="list-col col-status">Status</div>
                <div className="list-col col-actions">Actions</div>
              </div>
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`list-row ${
                    submission.status === "removed" ? "removed" : ""
                  } ${selectedIds.has(submission.id) ? "selected" : ""}`}
                >
                  <div className="list-col col-select">
                    {submission.image_url && (
                      <button
                        className="select-checkbox-list"
                        onClick={() => toggleSelection(submission.id)}
                      >
                        {selectedIds.has(submission.id) ? (
                          <IconSquareCheck size={20} />
                        ) : (
                          <IconSquare size={20} />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="list-col col-image">
                    {submission.image_url ? (
                      <img
                        src={submission.image_url}
                        alt={submission.template_name}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <IconEyeOff size={20} />
                      </div>
                    )}
                  </div>
                  <div className="list-col col-template">
                    {submission.template_name}
                  </div>
                  <div className="list-col col-id" title={submission.id}>
                    {submission.id}
                  </div>
                  <div className="list-col col-date">
                    {formatDate(submission.created_at)}
                  </div>
                  <div className="list-col col-status">
                    <span
                      className={`status-badge ${
                        submission.status === "active" ? "active" : "removed"
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                  <div className="list-col col-actions">
                    {submission.status === "active" && submission.image_url && (
                      <button
                        onClick={() => handleRemoveFloat(submission)}
                        className="action-btn remove"
                        title="Remove from parade"
                      >
                        <IconTrash size={18} />
                      </button>
                    )}
                    {submission.status === "removed" &&
                      submission.image_url && (
                        <button
                          onClick={() => handleRestore(submission)}
                          className="action-btn restore"
                          title="Restore to parade"
                        >
                          <IconRefresh size={18} />
                        </button>
                      )}
                    {submission.status === "removed" && (
                      <button
                        onClick={() => handlePermanentDelete(submission)}
                        className="action-btn delete"
                        title="Permanently delete"
                      >
                        <IconTrashX size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
