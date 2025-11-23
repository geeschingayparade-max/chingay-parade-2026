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
} from "@tabler/icons-react";
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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>(
    []
  );
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("all");
  const [showRemoved, setShowRemoved] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
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
      const response = await fetch(
        `/api/submissions/${submission.id}/moderate`,
        {
          method: "DELETE",
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
      </div>

      {/* Controls */}
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
      </div>

      {/* Submissions Grid */}
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
              }`}
            >
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
                  {submission.image_url && (
                    <button
                      onClick={() => handleRemoveFloat(submission)}
                      className="remove-button"
                    >
                      <IconTrash size={18} />
                      Remove
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
    </div>
  );
}
